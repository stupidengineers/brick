/**
 * Single tool call round trip — no network.
 */
import assert from "node:assert/strict";
import { mkdtemp, rm, writeFile } from "node:fs/promises";
import { homedir, tmpdir } from "node:os";
import { join } from "node:path";
import { runAgent } from "../src/loop.js";
import { FAKE_MODEL, makeFakeStream } from "./helpers.js";

const tmpDir = await mkdtemp(join(tmpdir(), "brick-test-"));
const sessionDir = join(tmpDir, "sessions");

// create a file for the agent to read
await writeFile(join(tmpDir, "note.txt"), "the answer is 42");

{
    const events: string[] = [];
    const result = await runAgent("Read note.txt and tell me the answer.", FAKE_MODEL, {
        cwd: tmpDir,
        sessionDir,
        streamFn: makeFakeStream([
            { type: "toolCall", name: "read_file", arguments: { path: join(tmpDir, "note.txt") } },
            { type: "text", text: "The answer is 42." },
        ]),
        onEvent: (e) => events.push(e.type),
    });

    assert.equal(result.finalMessage.stopReason, "stop");
    assert.ok(events.includes("tool_start"), "expected tool_start event");
    assert.ok(events.includes("tool_end"), "expected tool_end event");
    assert.ok(events.includes("done"), "expected done event");
    assert.equal(result.session.iterationCount, 2);
    console.log("ok: single tool call round trip completes");
}

await rm(tmpDir, { recursive: true });
