import type { Model } from "./types.js";

/**
 * Sends a minimal request to force the model into memory.
 * Call fire-and-forget (void) — failure is non-fatal.
 */
export async function warmupModel(model: Model): Promise<void> {
    try {
        const url = `${model.baseUrl}/v1/chat/completions`;
        const apiKey = model.apiKey;
        const headers: Record<string, string> = { "Content-Type": "application/json" };
        if (apiKey) headers.Authorization = `Bearer ${apiKey}`;

        await fetch(url, {
            method: "POST",
            headers,
            body: JSON.stringify({
                model: model.id,
                messages: [{ role: "user", content: " " }],
                max_tokens: 1,
                stream: false,
            }),
        });
    } catch {
        // non-fatal — ollama may not be running yet
    }
}
