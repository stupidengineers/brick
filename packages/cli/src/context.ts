import { readFile } from "node:fs/promises";
import { join } from "node:path";

async function tryRead(path: string): Promise<string | null> {
    try {
        return await readFile(path, "utf-8");
    } catch (err: unknown) {
        if ((err as NodeJS.ErrnoException).code === "ENOENT") return null;
        throw err;
    }
}

/**
 * Loads project context for the agent.
 *
 * Priority:
 *   1. AGENTS.md — primary source, open convention respected by many AI tools
 *   2. BRICK.md  — optional brick-specific additions on top of AGENTS.md
 *
 * If both exist, they are combined (AGENTS.md first, BRICK.md appended).
 * BRICK.md is intentionally minimal — prefer AGENTS.md for shared conventions.
 */
export async function loadProjectContext(cwd: string): Promise<string | null> {
    const [agents, brick] = await Promise.all([
        tryRead(join(cwd, "AGENTS.md")),
        tryRead(join(cwd, "BRICK.md")),
    ]);

    if (agents && brick) return `${agents}\n\n---\n\n${brick}`;
    return agents ?? brick;
}
