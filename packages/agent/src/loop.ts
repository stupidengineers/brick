import { stream, validateToolCall } from "@brick/ai";
import type { AssistantMessage, Context, Message, ToolResultMessage } from "@brick/ai";
import type { Model } from "@brick/ai";
import { createSession, saveSession } from "./session.js";
import { getBuiltInTools } from "./tools/index.js";
import type { InternalTool } from "./tools/types.js";
import type { AgentOptions, AgentResult, Session } from "./types.js";

const SYSTEM_PROMPT = `You are a coding agent that helps with programming tasks.
Only use tools when the task requires reading, writing, or running something.
For conversational messages or simple questions, respond directly without calling any tools.
When using tools: read files before editing them, verify your work after changes.
When the task is complete, respond with a concise summary.`;

export async function runAgent(
    task: string,
    model: Model,
    options?: AgentOptions
): Promise<AgentResult> {
    const cwd = options?.cwd ?? process.cwd();
    const maxIterations = options?.maxIterations ?? 50;
    const onEvent = options?.onEvent ?? (() => {});
    const streamFn = options?.streamFn ?? stream;

    const tools = getBuiltInTools(cwd);
    const toolDefs = tools.map((t) => t.definition);
    const toolMap = new Map<string, InternalTool>(tools.map((t) => [t.definition.name, t]));

    const startingMessages: Message[] = options?.initialMessages ?? [];
    const context: Context = {
        systemPrompt: SYSTEM_PROMPT,
        messages: [...startingMessages, { role: "user", content: task }],
        tools: toolDefs,
    };

    const session: Session = createSession(task, model);

    let iterations = 0;
    let finalMessage: AssistantMessage | undefined;

    while (iterations < maxIterations) {
        if (options?.signal?.aborted) break;
        iterations++;

        const s = streamFn(
            model,
            context,
            options?.signal !== undefined ? { signal: options.signal } : undefined
        );
        let assistantMsg: AssistantMessage | undefined;

        for await (const event of s) {
            if (event.type === "text_delta") {
                onEvent({ type: "text", delta: event.delta });
            }
            if (event.type === "done" || event.type === "error") {
                assistantMsg = event.message;
            }
        }

        if (!assistantMsg) break;

        context.messages.push(assistantMsg);
        session.messages.push(assistantMsg);
        session.iterationCount = iterations;

        const toolCalls = assistantMsg.content.filter((c) => c.type === "toolCall");

        if (toolCalls.length === 0 || assistantMsg.stopReason !== "toolUse") {
            finalMessage = assistantMsg;
            onEvent({ type: "done", message: assistantMsg });
            break;
        }

        // execute each tool call and push results back into context
        for (const call of toolCalls) {
            if (call.type !== "toolCall") continue;

            onEvent({ type: "tool_start", name: call.name, arguments: call.arguments });

            let result: string;
            let isError = false;

            const tool = toolMap.get(call.name);
            if (!tool) {
                result = `unknown tool: ${call.name}`;
                isError = true;
            } else {
                try {
                    const validArgs = validateToolCall(toolDefs, call);
                    result = await tool.execute(validArgs);
                } catch (err) {
                    result = err instanceof Error ? err.message : String(err);
                    isError = true;
                }
            }

            onEvent({ type: "tool_end", name: call.name, result, isError });

            const toolResult: ToolResultMessage = {
                role: "toolResult",
                toolCallId: call.id,
                toolName: call.name,
                content: [{ type: "text", text: result }],
                isError,
            };
            context.messages.push(toolResult);
            session.messages.push(toolResult);
        }
    }

    if (!finalMessage) {
        const errMsg = options?.signal?.aborted
            ? "agent was aborted"
            : `max iterations (${maxIterations}) reached without completing the task`;

        finalMessage = {
            role: "assistant",
            content: [],
            stopReason: options?.signal?.aborted ? "aborted" : "error",
            errorMessage: errMsg,
        };
        onEvent({ type: "error", message: errMsg });
    }

    session.endedAt = Date.now();
    session.iterationCount = iterations;
    await saveSession(session, options?.sessionDir);

    return { session, finalMessage };
}
