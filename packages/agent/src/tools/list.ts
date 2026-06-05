import { readdir } from "node:fs/promises";
import { Type } from "@sinclair/typebox";
import type { InternalTool } from "./types.js";

export const listDirectoryTool: InternalTool = {
    definition: {
        name: "list_directory",
        description: "List files and directories at a path. Prefixes: d=directory, f=file.",
        parameters: Type.Object({
            path: Type.String({ description: "Directory path to list" }),
        }),
    },
    async execute(args) {
        const entries = await readdir(args.path as string, { withFileTypes: true });
        if (entries.length === 0) return "(empty directory)";
        return entries.map((e) => `${e.isDirectory() ? "d" : "f"} ${e.name}`).join("\n");
    },
};
