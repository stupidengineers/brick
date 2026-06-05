import type { Tool } from "@brick/ai";

export interface InternalTool {
    definition: Tool;
    execute: (args: Record<string, unknown>) => Promise<string>;
}
