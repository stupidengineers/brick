/**
 * validateToolCall — no network required.
 */
import assert from "node:assert/strict";
import { Type } from "@sinclair/typebox";
import type { Tool, ToolCallContent } from "../src/types.js";
import { validateToolCall } from "../src/validate.js";

const tools: Tool[] = [
    {
        name: "get_weather",
        description: "Get the weather",
        parameters: Type.Object({
            city: Type.String(),
            units: Type.Optional(Type.Union([Type.Literal("celsius"), Type.Literal("fahrenheit")])),
        }),
    },
    {
        name: "add",
        description: "Add two numbers",
        parameters: Type.Object({
            a: Type.Number(),
            b: Type.Number(),
        }),
    },
];

function makeCall(name: string, args: Record<string, unknown>): ToolCallContent {
    return { type: "toolCall", id: "test-id", name, arguments: args };
}

function test(description: string, fn: () => void): void {
    fn();
    console.log(`ok: ${description}`);
}

test("valid args pass through", () => {
    const result = validateToolCall(tools, makeCall("get_weather", { city: "Paris" }));
    assert.equal(result.city, "Paris");
});

test("string-to-number coercion works", () => {
    const result = validateToolCall(tools, makeCall("add", { a: "1", b: "2" }));
    assert.equal(result.a, 1);
    assert.equal(result.b, 2);
});

test("missing required field throws", () => {
    assert.throws(() => validateToolCall(tools, makeCall("get_weather", {})), /invalid arguments/);
});

test("non-coercible type throws", () => {
    assert.throws(
        () => validateToolCall(tools, makeCall("add", { a: "not-a-number", b: 2 })),
        /invalid arguments/
    );
});

test("unknown tool throws", () => {
    assert.throws(() => validateToolCall(tools, makeCall("unknown_tool", {})), /unknown tool/);
});
