/**
 * Tool call parsing — requires OLLAMA_HOST.
 * Uses a model that reliably produces tool calls.
 */
import assert from "node:assert/strict";
import { Type } from "@sinclair/typebox";
import { complete } from "../src/complete.js";
import type { Context, Tool } from "../src/types.js";
import { getOllamaEnv, skip } from "./helpers.js";

const env = getOllamaEnv();
if (!env) skip("OLLAMA_HOST not set");

const tools: Tool[] = [
    {
        name: "get_weather",
        description: "Get the current weather for a city",
        parameters: Type.Object({
            city: Type.String({ description: "The city name" }),
        }),
    },
];

const context: Context = {
    systemPrompt: "You must call the get_weather tool. Do not answer directly.",
    messages: [{ role: "user", content: "What is the weather in Paris?" }],
    tools,
};

// model emits a tool call
{
    const msg = await complete(env.model, context);
    const toolCalls = msg.content.filter((c) => c.type === "toolCall");

    assert.ok(toolCalls.length > 0, "expected at least one tool call");

    const call = toolCalls[0];
    assert.ok(call !== undefined && call.type === "toolCall");
    assert.equal(call.name, "get_weather");
    assert.ok(typeof call.arguments.city === "string", "expected city argument");
    assert.equal(msg.stopReason, "toolUse");
    console.log(`ok: model called get_weather with city="${call.arguments.city}"`);
}
