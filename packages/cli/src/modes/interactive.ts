import { createInterface } from "node:readline";
import type { ParsedArgs } from "../args.js";
import { dim, writeLine } from "../renderer.js";
import { runOneShot } from "./oneshot.js";

const CHITCHAT = new Set([
    "hello",
    "hi",
    "hey",
    "sup",
    "yo",
    "thanks",
    "thank you",
    "bye",
    "goodbye",
]);

function isChitchat(input: string): boolean {
    return CHITCHAT.has(
        input
            .toLowerCase()
            .replace(/[^a-z ]/g, "")
            .trim()
    );
}

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

        // Don't burn tokens on greetings — the agent is for coding tasks.
        if (isChitchat(input)) {
            writeLine(dim("I'm a coding agent. Give me a task and I'll get to work."));
            continue;
        }

        await runOneShot(input, args);
    }

    rl.close();
}
