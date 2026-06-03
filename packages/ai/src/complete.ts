import { stream } from "./stream.js";
import type { AssistantMessage, Context, Model, StreamOptions } from "./types.js";

export async function complete(
    model: Model,
    context: Context,
    options?: StreamOptions
): Promise<AssistantMessage> {
    return stream(model, context, options).result();
}
