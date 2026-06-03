import { doStream } from "./providers/index.js";
import type { AssistantMessage, Context, Model, StreamEvent, StreamOptions } from "./types.js";

export interface StreamHandle {
    [Symbol.asyncIterator](): AsyncIterator<StreamEvent>;
    result(): Promise<AssistantMessage>;
}

export function stream(model: Model, context: Context, options?: StreamOptions): StreamHandle {
    let finalMessage: AssistantMessage | undefined;

    async function* generate(): AsyncGenerator<StreamEvent> {
        try {
            for await (const event of doStream(model, context, options)) {
                if (event.type === "done" || event.type === "error") {
                    finalMessage = event.message;
                }
                yield event;
            }
        } catch (err) {
            const aborted =
                options?.signal?.aborted || (err instanceof Error && err.name === "AbortError");
            const message: AssistantMessage = {
                role: "assistant",
                content: [],
                stopReason: aborted ? "aborted" : "error",
                errorMessage: err instanceof Error ? err.message : String(err),
            };
            finalMessage = message;
            yield { type: "error", reason: aborted ? "aborted" : "error", message };
        }
    }

    const gen = generate();

    return {
        [Symbol.asyncIterator](): AsyncIterator<StreamEvent> {
            return gen;
        },
        async result(): Promise<AssistantMessage> {
            for await (const _event of gen) {
                // drain remaining events — final message is captured in generate()
            }
            if (!finalMessage) throw new Error("stream completed without a final message");
            return finalMessage;
        },
    };
}
