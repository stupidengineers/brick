/**
 * Tests for loadConfig and parseModelString.
 */
import assert from "node:assert/strict";
import { mkdir, mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { loadConfig, parseModelString } from "../src/config.js";

// --- parseModelString ---

{
    const result = parseModelString("ollama/qwen2.5-coder:7b");
    assert.equal(result.provider, "ollama");
    assert.equal(result.id, "qwen2.5-coder:7b");
    console.log("ok: parseModelString handles provider/id");
}

{
    const result = parseModelString("openai/gpt-4");
    assert.equal(result.provider, "openai");
    assert.equal(result.id, "gpt-4");
    console.log("ok: parseModelString handles openai/gpt-4");
}

{
    const result = parseModelString("qwen2.5-coder:7b");
    assert.equal(result.provider, "ollama");
    assert.equal(result.id, "qwen2.5-coder:7b");
    console.log("ok: parseModelString defaults to ollama for bare id");
}

{
    const result = parseModelString("llama3");
    assert.equal(result.provider, "ollama");
    assert.equal(result.id, "llama3");
    console.log("ok: parseModelString defaults to ollama for bare model name");
}

// --- loadConfig ---

const originalHome = process.env.HOME;

// Missing config file returns defaults
{
    const tmpDir = await mkdtemp(join(tmpdir(), "brick-config-test-"));
    process.env.HOME = tmpDir;

    const config = await loadConfig();
    assert.equal(config.defaultModel, "ollama/qwen2.5-coder:7b");
    assert.equal(config.ollamaHost, "http://localhost:11434");

    process.env.HOME = originalHome;
    await rm(tmpDir, { recursive: true });
    console.log("ok: missing config file returns defaults");
}

// Existing config file is merged with defaults
{
    const tmpDir = await mkdtemp(join(tmpdir(), "brick-config-test-"));
    await mkdir(join(tmpDir, ".brick"), { recursive: true });
    await writeFile(
        join(tmpDir, ".brick", "config.json"),
        JSON.stringify({ defaultModel: "openai/gpt-4" }),
        "utf-8"
    );

    process.env.HOME = tmpDir;
    const config = await loadConfig();
    assert.equal(config.defaultModel, "openai/gpt-4");
    assert.equal(config.ollamaHost, "http://localhost:11434");

    process.env.HOME = originalHome;
    await rm(tmpDir, { recursive: true });
    console.log("ok: existing config file is merged with defaults");
}

// overrides.model wins over config file
{
    const tmpDir = await mkdtemp(join(tmpdir(), "brick-config-test-"));
    await mkdir(join(tmpDir, ".brick"), { recursive: true });
    await writeFile(
        join(tmpDir, ".brick", "config.json"),
        JSON.stringify({ defaultModel: "openai/gpt-4" }),
        "utf-8"
    );

    process.env.HOME = tmpDir;
    const config = await loadConfig({ model: "custom/my-model" });
    assert.equal(config.defaultModel, "custom/my-model");

    process.env.HOME = originalHome;
    await rm(tmpDir, { recursive: true });
    console.log("ok: overrides.model wins over config file");
}

// overrides.model wins when no config file
{
    const tmpDir = await mkdtemp(join(tmpdir(), "brick-config-test-"));
    process.env.HOME = tmpDir;

    const config = await loadConfig({ model: "ollama/llama3" });
    assert.equal(config.defaultModel, "ollama/llama3");
    assert.equal(config.ollamaHost, "http://localhost:11434");

    process.env.HOME = originalHome;
    await rm(tmpDir, { recursive: true });
    console.log("ok: overrides.model wins over defaults when no config file");
}
