/**
 * Agent stops at maxIterations and emits an error event.
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
    // model keeps calling tools forever — agent must stop at cap
    const infiniteTools: ReturnType<typeof makeFakeStream> = makeFakeStream(
        Array.from({ length: 10 }, () => ({
            type: "toolCall" as const,
            name: "run_command",
            arguments: { command: "echo loop" },
        }))
    );

    let errorEventFired = false;
    const result = await runAgent("Loop forever.", FAKE_MODEL, {
        cwd: tmpDir,
        sessionDir,
        maxIterations: 3,
        streamFn: infiniteTools,
        onEvent: (e) => {
            if (e.type === "error") errorEventFired = true;
        },
    });

    assert.ok(errorEventFired, "expected error event");
    assert.equal(result.finalMessage.stopReason, "error");
    assert.ok(result.session.iterationCount <= 3, "expected at most 3 iterations");
    console.log("ok: agent stops at maxIterations and emits error event");
}

await rm(tmpDir, { recursive: true });
