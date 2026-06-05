import { loadConfig } from "../config.js";
import { bold, green, writeLine } from "../renderer.js";

export async function runModels(): Promise<void> {
    const config = await loadConfig();
    writeLine(`${green("default")}   ${bold(config.defaultModel)}`);
}
