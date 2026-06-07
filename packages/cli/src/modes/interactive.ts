import { createInterface } from "node:readline";
import type { Message } from "@brick/ai";
import { warmupModel } from "@brick/ai";
import type { ParsedArgs } from "../args.js";
import { buildModel } from "../config.js";
import { dim, writeLine } from "../renderer.js";
import { runOneShot } from "./oneshot.js";

export async function runInteractive(args: ParsedArgs): Promise<void> {
    // Build model config once — shared across all turns.
    const model = await buildModel(args);

    // Warm up the model in the background so the first message is fast.
    void warmupModel(model);

    const rl = createInterface({ input: process.stdin, output: process.stdout });

    const ask = (prompt: string): Promise<string> =>
        new Promise((resolve) => rl.question(prompt, resolve));

    rl.on("SIGINT", () => {
        writeLine("");
        rl.close();
        process.exit(0);
    });

    writeLine(dim("brick — type a task, or 'exit' to quit"));

    // Conversation history — carries context across turns.
    let history: Message[] = [];

    while (true) {
        const input = (await ask("> ")).trim();

        if (input === "") continue;
        if (input === "exit" || input === "quit") break;

        const turnMessages = await runOneShot(input, args, history);
        history = [...history, ...turnMessages];
    }

    rl.close();
}
