import { readFile } from "node:fs/promises";
import { join } from "node:path";

/**
 * Loads project-level context from BRICK.md in the given directory.
 * Returns the file content, or null if the file does not exist.
 * AGENTS.md is intentionally excluded — it is a convention for other AI tools,
 * not project context meant for brick's agent.
 */
export async function loadProjectContext(cwd: string): Promise<string | null> {
    for (const filename of ["BRICK.md"]) {
        try {
            return await readFile(join(cwd, filename), "utf-8");
        } catch (err: unknown) {
            if ((err as NodeJS.ErrnoException).code === "ENOENT") continue;
            throw err;
        }
    }
    return null;
}
