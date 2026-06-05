/**
 * Multi-turn: agent calls multiple tools across multiple iterations.
 */
import assert from "node:assert/strict";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { runAgent } from "../src/loop.js";
import { FAKE_MODEL, makeFakeStream } from "./helpers.js";

const tmpDir = await mkdtemp(join(tmpdir(), "brick-test-"));
const sessionDir = join(tmpDir, "sessions");

{
    const toolsUsed: string[] = [];
    const result = await runAgent("List the directory then run echo done.", FAKE_MODEL, {
        cwd: tmpDir,
        sessionDir,
        streamFn: makeFakeStream([
            { type: "toolCall", name: "list_directory", arguments: { path: tmpDir } },
            { type: "toolCall", name: "run_command", arguments: { command: "echo done" } },
            { type: "text", text: "All done." },
        ]),
        onEvent: (e) => {
            if (e.type === "tool_start") toolsUsed.push(e.name);
        },
    });

    assert.deepEqual(toolsUsed, ["list_directory", "run_command"]);
    assert.equal(result.finalMessage.stopReason, "stop");
    assert.equal(result.session.iterationCount, 3);
    console.log("ok: agent calls multiple tools across multiple iterations");
}

await rm(tmpDir, { recursive: true });
