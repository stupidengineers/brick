/**
 * Session persistence — write to disk and load back.
 */
import assert from "node:assert/strict";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { runAgent } from "../src/loop.js";
import { listSessions, loadSession } from "../src/session.js";
import { FAKE_MODEL, makeFakeStream } from "./helpers.js";

const tmpDir = await mkdtemp(join(tmpdir(), "brick-test-"));
const sessionDir = join(tmpDir, "sessions");

// run agent so a session is saved
const result = await runAgent("Say hello.", FAKE_MODEL, {
    cwd: tmpDir,
    sessionDir,
    streamFn: makeFakeStream([{ type: "text", text: "Hello!" }]),
});

// session can be loaded back
{
    const loaded = await loadSession(result.session.id, sessionDir);
    assert.equal(loaded.id, result.session.id);
    assert.equal(loaded.task, "Say hello.");
    assert.ok(loaded.endedAt !== undefined, "expected endedAt to be set");
    assert.ok(loaded.messages.length > 0, "expected messages to be saved");
    console.log("ok: session written to disk and loaded back correctly");
}

// session appears in listSessions
{
    const sessions = await listSessions(sessionDir);
    assert.ok(
        sessions.some((s) => s.id === result.session.id),
        "expected session in list"
    );
    console.log("ok: session appears in listSessions");
}

// listSessions returns empty array when dir does not exist
{
    const sessions = await listSessions(join(tmpDir, "nonexistent"));
    assert.deepEqual(sessions, []);
    console.log("ok: listSessions returns empty array for missing directory");
}

await rm(tmpDir, { recursive: true });
