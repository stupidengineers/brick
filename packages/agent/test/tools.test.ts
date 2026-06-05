/**
 * Built-in tools in isolation — no network, no LLM.
 */
import assert from "node:assert/strict";
import { mkdtemp, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { getBuiltInTools } from "../src/tools/index.js";

const tmpDir = await mkdtemp(join(tmpdir(), "brick-test-"));
const tools = getBuiltInTools(tmpDir);
const byName = new Map(tools.map((t) => [t.definition.name, t]));

function get(name: string) {
    const t = byName.get(name);
    assert.ok(t, `tool ${name} not found`);
    return t;
}

// write_file creates the file
{
    await get("write_file").execute({ path: join(tmpDir, "hello.txt"), content: "hello world" });
    const content = await readFile(join(tmpDir, "hello.txt"), "utf-8");
    assert.equal(content, "hello world");
    console.log("ok: write_file creates a file");
}

// read_file returns file contents
{
    const result = await get("read_file").execute({ path: join(tmpDir, "hello.txt") });
    assert.equal(result, "hello world");
    console.log("ok: read_file returns file contents");
}

// write_file creates parent directories
{
    await get("write_file").execute({
        path: join(tmpDir, "nested/dir/file.txt"),
        content: "nested",
    });
    const content = await readFile(join(tmpDir, "nested/dir/file.txt"), "utf-8");
    assert.equal(content, "nested");
    console.log("ok: write_file creates parent directories");
}

// list_directory returns entries
{
    const result = await get("list_directory").execute({ path: tmpDir });
    assert.ok(result.includes("hello.txt"), "expected hello.txt in listing");
    assert.ok(result.includes("nested"), "expected nested dir in listing");
    console.log("ok: list_directory returns entries");
}

// run_command returns stdout
{
    const result = await get("run_command").execute({ command: "echo hello" });
    assert.ok(result.includes("hello"), "expected echo output");
    console.log("ok: run_command returns stdout");
}

// run_command captures non-zero exit
{
    const result = await get("run_command").execute({ command: "exit 1" });
    assert.ok(result.includes("exit code"), "expected exit code in output");
    console.log("ok: run_command captures non-zero exit");
}

// read_file throws on missing file
await assert.rejects(
    () => get("read_file").execute({ path: join(tmpDir, "nonexistent.txt") }),
    /ENOENT/
);
console.log("ok: read_file throws ENOENT on missing file");

await rm(tmpDir, { recursive: true });
