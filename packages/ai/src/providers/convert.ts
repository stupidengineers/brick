import type { Context, Tool } from "../types.js";

// Internal OpenAI wire types — not exported from the package.

interface OAITextPart {
    type: "text";
    text: string;
}

interface OAIImagePart {
    type: "image_url";
    image_url: { url: string };
}

interface OAIToolCall {
    id: string;
    type: "function";
    function: { name: string; arguments: string };
}

type OAIMessage =
    | { role: "system"; content: string }
    | { role: "user"; content: string | Array<OAITextPart | OAIImagePart> }
    | { role: "assistant"; content?: string | null; tool_calls?: OAIToolCall[] }
    | { role: "tool"; tool_call_id: string; content: string };

interface OAITool {
    type: "function";
    function: {
        name: string;
        description: string;
        parameters: unknown;
    };
}

export interface OAIRequest {
    model: string;
    messages: OAIMessage[];
    tools?: OAITool[];
    tool_choice?: "auto";
    stream: true;
    stream_options?: { include_usage: true };
}

export function buildRequest(modelId: string, context: Context): OAIRequest {
    const messages: OAIMessage[] = [];

    if (context.systemPrompt) {
        messages.push({ role: "system", content: context.systemPrompt });
    }

    for (const msg of context.messages) {
        if (msg.role === "user") {
            if (typeof msg.content === "string") {
                messages.push({ role: "user", content: msg.content });
            } else {
                messages.push({
                    role: "user",
                    content: msg.content.map((c) => {
                        if (c.type === "text") return { type: "text" as const, text: c.text };
                        return {
                            type: "image_url" as const,
                            image_url: { url: `data:${c.mimeType};base64,${c.data}` },
                        };
                    }),
                });
            }
        } else if (msg.role === "assistant") {
            const textBlocks = msg.content.filter((c) => c.type === "text");
            const toolBlocks = msg.content.filter((c) => c.type === "toolCall");

            const toolCallsList =
                toolBlocks.length > 0
                    ? toolBlocks.map((c) => {
                          if (c.type !== "toolCall") throw new Error("unreachable");
                          return {
                              id: c.id,
                              type: "function" as const,
                              function: {
                                  name: c.name,
                                  arguments: JSON.stringify(c.arguments),
                              },
                          };
                      })
                    : undefined;

            messages.push({
                role: "assistant",
                content: textBlocks.map((c) => (c.type === "text" ? c.text : "")).join("") || null,
                ...(toolCallsList !== undefined ? { tool_calls: toolCallsList } : {}),
            });
        } else if (msg.role === "toolResult") {
            messages.push({
                role: "tool",
                tool_call_id: msg.toolCallId,
                content: msg.content
                    .map((c) => (c.type === "text" ? c.text : "[image]"))
                    .join("\n"),
            });
        }
    }

    const tools = context.tools ? toOAITools(context.tools) : undefined;

    return {
        model: modelId,
        messages,
        ...(tools ? { tools, tool_choice: "auto" } : {}),
        stream: true,
        stream_options: { include_usage: true },
    };
}

function toOAITools(tools: Tool[]): OAITool[] {
    return tools.map((t) => ({
        type: "function" as const,
        function: {
            name: t.name,
            description: t.description,
            parameters: t.parameters,
        },
    }));
}
