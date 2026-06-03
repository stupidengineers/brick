import type { Model } from "../types.js";

export function ollamaModel(id: string, baseUrl?: string): Model {
    return {
        provider: "ollama",
        id,
        baseUrl: baseUrl ?? process.env.OLLAMA_HOST ?? "http://localhost:11434",
    };
}
