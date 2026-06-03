import { Value } from "@sinclair/typebox/value";
import type { Tool, ToolCallContent } from "./types.js";

/**
 * Validates tool call arguments against the tool's TypeBox schema.
 * Attempts coercion (e.g. "42" → 42) before checking.
 * Throws a descriptive error on failure.
 */
export function validateToolCall(tools: Tool[], call: ToolCallContent): Record<string, unknown> {
    const tool = tools.find((t) => t.name === call.name);
    if (!tool) throw new Error(`unknown tool: ${call.name}`);

    const coerced = Value.Convert(tool.parameters, call.arguments);

    if (!Value.Check(tool.parameters, coerced)) {
        const errors = [...Value.Errors(tool.parameters, coerced)];
        const detail = errors.map((e) => `${e.path || "/"}: ${e.message}`).join("; ");
        throw new Error(`invalid arguments for "${call.name}": ${detail}`);
    }

    return coerced as Record<string, unknown>;
}
