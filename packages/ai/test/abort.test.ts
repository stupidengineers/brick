/**
 * Abort signal — requires OLLAMA_HOST.
 */
import assert from "node:assert/strict";
import { stream } from "../src/stream.js";
import type { Context } from "../src/types.js";
import { getOllamaEnv, skip } from "./helpers.js";

const env = getOllamaEnv();
if (!env) skip("OLLAMA_HOST not set");

const context: Context = {
    messages: [{ role: "user", content: "Count slowly from 1 to 1000, one number per line." }],
};

// aborting mid-stream produces an error event with reason "aborted"
{
    const controller = new AbortController();
    const s = stream(env.model, context, { signal: controller.signal });

    let deltaCount = 0;
    let abortedEvent = false;

    for await (const event of s) {
        if (event.type === "text_delta") {
            deltaCount++;
            if (deltaCount === 3) controller.abort();
        }
        if (event.type === "error" && event.reason === "aborted") {
            abortedEvent = true;
            assert.equal(event.message.stopReason, "aborted");
            break;
        }
    }

    assert.ok(abortedEvent, "expected aborted error event");
    console.log("ok: abort mid-stream produces error event with reason=aborted");
}
