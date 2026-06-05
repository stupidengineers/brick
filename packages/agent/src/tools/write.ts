import { mkdir, writeFile } from "node:fs/promises";
import { dirname } from "node:path";
import { Type } from "@sinclair/typebox";
import type { InternalTool } from "./types.js";

export const writeFileTool: InternalTool = {
    definition: {
        name: "write_file",
        description: "Write content to a file. Creates parent directories if needed.",
        parameters: Type.Object({
            path: Type.String({ description: "Path to the file to write" }),
            content: Type.String({ description: "Content to write" }),
        }),
    },
    async execute(args) {
        const path = args.path as string;
        const content = args.content as string;
        await mkdir(dirname(path), { recursive: true });
        await writeFile(path, content, "utf-8");
        return `wrote ${content.length} bytes to ${path}`;
    },
};
