/**
 * Token usage — requires OLLAMA_HOST.
 */
import assert from "node:assert/strict";
import { complete } from "../src/complete.js";
import type { Context } from "../src/types.js";
import { getOllamaEnv, skip } from "./helpers.js";

const env = getOllamaEnv();
if (!env) skip("OLLAMA_HOST not set");

const context: Context = {
    messages: [{ role: "user", content: "Say hello." }],
};

// usage fields are present and non-zero
{
    const msg = await complete(env.model, context);

    assert.ok(msg.usage !== undefined, "expected usage to be present");
    assert.ok(msg.usage.inputTokens > 0, "expected inputTokens > 0");
    assert.ok(msg.usage.outputTokens > 0, "expected outputTokens > 0");
    console.log(`ok: usage present — in=${msg.usage.inputTokens} out=${msg.usage.outputTokens}`);
}
