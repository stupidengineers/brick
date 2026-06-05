import { readFile } from "node:fs/promises";
import { join } from "node:path";

/**
 * Loads project-level context from BRICK.md or AGENTS.md in the given directory.
 * Returns the file content, or null if neither file exists.
 * Checked in order: BRICK.md first, AGENTS.md as fallback.
 */
export async function loadProjectContext(cwd: string): Promise<string | null> {
    for (const filename of ["BRICK.md", "AGENTS.md"]) {
        try {
            return await readFile(join(cwd, filename), "utf-8");
        } catch (err: unknown) {
            if ((err as NodeJS.ErrnoException).code === "ENOENT") continue;
            throw err;
        }
    }
    return null;
}
