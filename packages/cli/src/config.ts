import { readFile } from "node:fs/promises";
import { homedir } from "node:os";
import { join } from "node:path";

export interface BrickConfig {
    defaultModel: string;
    ollamaHost: string;
}

const DEFAULTS: BrickConfig = {
    defaultModel: "ollama/qwen2.5-coder:7b",
    ollamaHost: "http://localhost:11434",
};

export function parseModelString(s: string): { provider: string; id: string } {
    const slashIdx = s.indexOf("/");
    if (slashIdx === -1) {
        return { provider: "ollama", id: s };
    }
    return { provider: s.slice(0, slashIdx), id: s.slice(slashIdx + 1) };
}

export async function loadConfig(overrides?: { model?: string }): Promise<BrickConfig> {
    const configPath = join(homedir(), ".brick", "config.json");

    let fileConfig: Partial<BrickConfig> = {};
    try {
        const content = await readFile(configPath, "utf-8");
        fileConfig = JSON.parse(content) as Partial<BrickConfig>;
    } catch {
        // missing or unreadable config — use defaults
    }

    const merged: BrickConfig = {
        defaultModel: fileConfig.defaultModel ?? DEFAULTS.defaultModel,
        ollamaHost: fileConfig.ollamaHost ?? DEFAULTS.ollamaHost,
    };

    if (overrides?.model !== undefined) {
        merged.defaultModel = overrides.model;
    }

    return merged;
}
