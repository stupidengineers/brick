import { loadSession, runAgent } from "@brick/agent";
import type { AgentEvent } from "@brick/agent";
import { ollamaModel, openaiModel } from "@brick/ai";
import type { ParsedArgs } from "../args.js";
import { loadConfig, parseModelString } from "../config.js";
import { loadProjectContext } from "../context.js";
import { dim, red, spinner, write, writeLine } from "../renderer.js";

export async function runOneShot(task: string, args: ParsedArgs): Promise<void> {
    const config = await loadConfig({ ...(args.model !== undefined ? { model: args.model } : {}) });

    const { provider, id } = parseModelString(config.defaultModel);
    const model = provider === "openai" ? openaiModel(id) : ollamaModel(id, config.ollamaHost);

    let stopSpinner: ((success: boolean) => void) | undefined;

    const onEvent = (event: AgentEvent): void => {
        if (event.type === "text") {
            write(event.delta);
        } else if (event.type === "tool_start") {
            stopSpinner = spinner(event.name);
        } else if (event.type === "tool_end") {
            if (stopSpinner !== undefined) {
                stopSpinner(!event.isError);
                stopSpinner = undefined;
            }
        } else if (event.type === "done") {
            writeLine("");
            writeLine(dim("done"));
        } else if (event.type === "error") {
            writeLine(red(event.message));
            process.exit(1);
        }
    };

    const cwd = args.cwd ?? process.cwd();

    const context = await loadProjectContext(cwd);
    const fullTask = context !== null ? `${task}\n\n---\nProject context:\n${context}` : task;

    const priorSession = args.session !== undefined ? await loadSession(args.session) : undefined;

    const { session } = await runAgent(fullTask, model, {
        cwd,
        onEvent,
        ...(priorSession !== undefined ? { initialMessages: priorSession.messages } : {}),
    });

    writeLine(dim(`[${session.id}] ${session.iterationCount} iteration(s)`));
}
