import type {
    AssistantMessage,
    Context,
    Model,
    StopReason,
    StreamEvent,
    StreamOptions,
    ToolCallContent,
} from "../types.js";
import { buildRequest } from "./convert.js";
import { parseSSE } from "./sse.js";

export { ollamaModel } from "./ollama.js";
export { openaiModel } from "./openai.js";

// Internal wire chunk shape from OpenAI-compatible streaming responses.
interface OAIChunk {
    choices: Array<{
        delta: {
            content?: string | null;
            tool_calls?: Array<{
                index: number;
                id?: string;
                function?: { name?: string; arguments?: string };
            }>;
        };
        finish_reason?: string | null;
    }>;
    usage?: { prompt_tokens: number; completion_tokens: number } | null;
}

function mapFinishReason(raw: string | null | undefined): StopReason {
    if (raw === "tool_calls") return "toolUse";
    if (raw === "length") return "length";
    return "stop";
}

export async function* doStream(
    model: Model,
    context: Context,
    options?: StreamOptions
): AsyncGenerator<StreamEvent> {
    const url = `${model.baseUrl}/v1/chat/completions`;
    const apiKey = options?.apiKey ?? model.apiKey;

    const headers: Record<string, string> = { "Content-Type": "application/json" };
    if (apiKey) headers.Authorization = `Bearer ${apiKey}`;

    const body = buildRequest(model.id, context);

    let response: Response;
    response = await fetch(url, {
        method: "POST",
        headers,
        body: JSON.stringify(body),
        // exactOptionalPropertyTypes: signal must be null, not undefined
        ...(options?.signal !== undefined ? { signal: options.signal } : {}),
    });

    if (!response.ok) {
        const text = await response.text().catch(() => "");
        throw new Error(`HTTP ${response.status}: ${text}`);
    }

    let accText = "";
    // accumulate tool calls by index since arguments arrive fragmented
    const pendingToolCalls = new Map<number, { id: string; name: string; args: string }>();
    let stopReason: StopReason = "stop";
    let inputTokens = 0;
    let outputTokens = 0;

    for await (const raw of parseSSE(response)) {
        let chunk: OAIChunk;
        try {
            chunk = JSON.parse(raw) as OAIChunk;
        } catch {
            continue;
        }

        if (chunk.usage) {
            inputTokens = chunk.usage.prompt_tokens;
            outputTokens = chunk.usage.completion_tokens;
        }

        for (const choice of chunk.choices) {
            const delta = choice.delta;

            if (delta.content) {
                accText += delta.content;
                yield { type: "text_delta", delta: delta.content };
            }

            if (delta.tool_calls) {
                for (const tc of delta.tool_calls) {
                    const existing = pendingToolCalls.get(tc.index) ?? {
                        id: "",
                        name: "",
                        args: "",
                    };
                    if (tc.id) existing.id = tc.id;
                    if (tc.function?.name) existing.name += tc.function.name;
                    if (tc.function?.arguments) existing.args += tc.function.arguments;
                    pendingToolCalls.set(tc.index, existing);
                }
            }

            if (choice.finish_reason) {
                stopReason = mapFinishReason(choice.finish_reason);
            }
        }
    }

    if (accText) yield { type: "text_end", text: accText };

    // parse accumulated tool calls and emit
    const resolvedToolCalls: ToolCallContent[] = [];
    for (const [, tc] of pendingToolCalls) {
        let args: Record<string, unknown> = {};
        try {
            args = JSON.parse(tc.args) as Record<string, unknown>;
        } catch {
            // model returned malformed JSON — pass empty args
        }
        const toolCall: ToolCallContent = {
            type: "toolCall",
            id: tc.id,
            name: tc.name,
            arguments: args,
        };
        resolvedToolCalls.push(toolCall);
        yield { type: "toolcall_end", toolCall };
    }

    const content: AssistantMessage["content"] = [];
    if (accText) content.push({ type: "text", text: accText });
    for (const tc of resolvedToolCalls) content.push(tc);

    const message: AssistantMessage = {
        role: "assistant",
        content,
        stopReason,
        usage: { inputTokens, outputTokens },
    };

    yield { type: "done", reason: stopReason, message };
}
