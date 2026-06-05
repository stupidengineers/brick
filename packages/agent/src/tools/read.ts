import { readFile } from "node:fs/promises";
import { Type } from "@sinclair/typebox";
import type { InternalTool } from "./types.js";

export const readFileTool: InternalTool = {
    definition: {
        name: "read_file",
        description: "Read the contents of a file. Returns the file content as text.",
        parameters: Type.Object({
            path: Type.String({ description: "Path to the file to read" }),
        }),
    },
    async execute(args) {
        const content = await readFile(args.path as string, "utf-8");
        return content;
    },
};
