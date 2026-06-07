import { loadSession, runAgent } from "@brick/agent";
import type { Message } from "@brick/ai";
import type { ParsedArgs } from "../args.js";
import { buildModel } from "../config.js";
import { loadProjectContext } from "../context.js";
import { dim, makeAgentEventHandler, writeLine } from "../renderer.js";

export async function runOneShot(
    task: string,
    args: ParsedArgs,
    initialMessages?: Message[]
): Promise<Message[]> {
    const model = await buildModel(args);
    const cwd = args.cwd ?? process.cwd();

    const context = await loadProjectContext(cwd);
    const fullTask = context !== null ? `${task}\n\n---\nProject context:\n${context}` : task;

    const priorSession = args.session !== undefined ? await loadSession(args.session) : undefined;

    const startingMessages: Message[] = priorSession?.messages ?? initialMessages ?? [];

    const { session } = await runAgent(fullTask, model, {
        cwd,
        onEvent: makeAgentEventHandler(),
        ...(startingMessages.length > 0 ? { initialMessages: startingMessages } : {}),
    });

    writeLine(dim(`[${session.id}] ${session.iterationCount} iteration(s)`));

    // return this turn's messages so interactive mode can build history
    return [{ role: "user", content: fullTask }, ...session.messages];
}
