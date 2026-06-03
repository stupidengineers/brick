import type { Model } from "../types.js";

export function openaiModel(id: string, apiKey?: string): Model {
    const key = apiKey ?? process.env.OPENAI_API_KEY;
    return {
        provider: "openai",
        id,
        baseUrl: "https://api.openai.com",
        ...(key !== undefined ? { apiKey: key } : {}),
    };
}
