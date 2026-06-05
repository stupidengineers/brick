import { exec } from "node:child_process";
import { promisify } from "node:util";
import { Type } from "@sinclair/typebox";
import type { InternalTool } from "./types.js";

const execAsync = promisify(exec);
const TIMEOUT_MS = 30_000;

export function makeRunCommandTool(cwd: string): InternalTool {
    return {
        definition: {
            name: "run_command",
            description:
                "Run a shell command. Returns stdout, stderr, and exit code. Times out after 30s.",
            parameters: Type.Object({
                command: Type.String({ description: "Shell command to run" }),
            }),
        },
        async execute(args) {
            const command = args.command as string;
            try {
                const { stdout, stderr } = await execAsync(command, { cwd, timeout: TIMEOUT_MS });
                const parts: string[] = [];
                if (stdout.trim()) parts.push(`stdout:\n${stdout.trimEnd()}`);
                if (stderr.trim()) parts.push(`stderr:\n${stderr.trimEnd()}`);
                return parts.length > 0 ? parts.join("\n") : "(no output)";
            } catch (err) {
                // exec rejects on non-zero exit — still useful output
                const e = err as {
                    stdout?: string;
                    stderr?: string;
                    code?: number;
                    message?: string;
                };
                const parts: string[] = [`exit code: ${e.code ?? "unknown"}`];
                if (e.stdout?.trim()) parts.push(`stdout:\n${e.stdout.trimEnd()}`);
                if (e.stderr?.trim()) parts.push(`stderr:\n${e.stderr.trimEnd()}`);
                return parts.join("\n");
            }
        },
    };
}
