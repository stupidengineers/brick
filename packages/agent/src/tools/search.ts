import { exec } from "node:child_process";
import { promisify } from "node:util";
import { Type } from "@sinclair/typebox";
import type { InternalTool } from "./types.js";

const execAsync = promisify(exec);

export function makeSearchTool(cwd: string): InternalTool {
    return {
        definition: {
            name: "search_files",
            description:
                "Search for a pattern across files using ripgrep. Returns matching lines with file and line number.",
            parameters: Type.Object({
                pattern: Type.String({ description: "Search pattern (regex)" }),
                directory: Type.Optional(
                    Type.String({ description: "Directory to search in. Defaults to cwd." })
                ),
            }),
        },
        async execute(args) {
            const pattern = args.pattern as string;
            const dir = (args.directory as string | undefined) ?? ".";
            try {
                const { stdout } = await execAsync(
                    `rg --line-number --no-heading "${pattern}" "${dir}"`,
                    {
                        cwd,
                        timeout: 15_000,
                    }
                );
                return stdout.trimEnd() || "(no matches)";
            } catch (err) {
                const e = err as { code?: number; stderr?: string };
                // rg exits 1 when no matches found — not a real error
                if (e.code === 1) return "(no matches)";
                throw new Error(`search failed: ${e.stderr ?? String(err)}`);
            }
        },
    };
}
