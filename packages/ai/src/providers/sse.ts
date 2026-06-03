/**
 * Parses an OpenAI-compatible Server-Sent Events stream.
 * Yields raw JSON strings, one per data line. Stops on [DONE].
 */
export async function* parseSSE(response: Response): AsyncGenerator<string> {
    if (!response.body) throw new Error("response has no body");

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = "";

    try {
        while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            buffer += decoder.decode(value, { stream: true });

            const lines = buffer.split("\n");
            buffer = lines.pop() ?? "";

            for (const line of lines) {
                const trimmed = line.trimEnd();
                if (!trimmed.startsWith("data: ")) continue;
                const data = trimmed.slice(6);
                if (data === "[DONE]") return;
                if (data) yield data;
            }
        }

        // flush remaining buffer
        for (const line of buffer.split("\n")) {
            const trimmed = line.trimEnd();
            if (!trimmed.startsWith("data: ")) continue;
            const data = trimmed.slice(6);
            if (data && data !== "[DONE]") yield data;
        }
    } finally {
        reader.releaseLock();
    }
}
