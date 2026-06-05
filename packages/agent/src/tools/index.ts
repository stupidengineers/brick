import { listDirectoryTool } from "./list.js";
import { readFileTool } from "./read.js";
import { makeRunCommandTool } from "./run.js";
import { makeSearchTool } from "./search.js";
import { writeFileTool } from "./write.js";

export type { InternalTool } from "./types.js";

export function getBuiltInTools(cwd: string) {
    return [
        readFileTool,
        writeFileTool,
        listDirectoryTool,
        makeRunCommandTool(cwd),
        makeSearchTool(cwd),
    ];
}
