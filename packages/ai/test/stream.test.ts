/**
 * Basic streaming — requires OLLAMA_HOST.
 */
import assert from "node:assert/strict";
import { stream } from "../src/stream.js";
import type { Context } from "../src/types.js";
import { getOllamaEnv, skip } from "./helpers.js";

const env = getOllamaEnv();
if (!env) skip("OLLAMA_HOST not set");

const context: Context = {
    messages: [{ role: "user", content: "Reply with exactly the word: pong" }],
};

// stream yields text_delta events
{
    const s = stream(env.model, context);
    let deltaCount = 0;
    let gotDone = false;

    for await (const event of s) {
        if (event.type === "text_delta") deltaCount++;
        if (event.type === "done") {
            gotDone = true;
            assert.equal(event.reason, "stop");
        }
        if (event.type === "error") {
            throw new Error(`unexpected error: ${event.message.errorMessage}`);
        }
    }

    assert.ok(deltaCount > 0, "expected at least one text_delta event");
    assert.ok(gotDone, "expected done event");
    console.log("ok: stream yields text_delta and done events");
}

// result() returns the assembled message
{
    const s = stream(env.model, context);
    const msg = await s.result();

    assert.equal(msg.role, "assistant");
    assert.ok(msg.content.length > 0);
    assert.ok(msg.content.some((c) => c.type === "text"));
    assert.equal(msg.stopReason, "stop");
    console.log("ok: result() returns assembled AssistantMessage");
}

// result() works even without iterating first
{
    const msg = await stream(env.model, context).result();
    const text = msg.content
        .filter((c) => c.type === "text")
        .map((c) => (c.type === "text" ? c.text : ""))
        .join("");
    assert.ok(text.length > 0, "expected non-empty text");
    console.log("ok: result() without prior iteration works");
}
