import { createInterface } from "node:readline";
import type { ParsedArgs } from "../args.js";
import { dim, writeLine } from "../renderer.js";
import { runOneShot } from "./oneshot.js";

export async function runInteractive(args: ParsedArgs): Promise<void> {
    const rl = createInterface({ input: process.stdin, output: process.stdout });

    const ask = (prompt: string): Promise<string> =>
        new Promise((resolve) => rl.question(prompt, resolve));

    rl.on("SIGINT", () => {
        writeLine("");
        rl.close();
        process.exit(0);
    });

    writeLine(dim("brick — type a task, or 'exit' to quit"));

    while (true) {
        const input = (await ask("> ")).trim();

        if (input === "") continue;
        if (input === "exit" || input === "quit") break;

        await runOneShot(input, args);
    }

    rl.close();
}
