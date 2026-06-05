import { randomBytes } from "node:crypto";
import { mkdir, readFile, readdir, writeFile } from "node:fs/promises";
import { homedir } from "node:os";
import { join } from "node:path";
import type { Model } from "@brick/ai";
import type { Session } from "./types.js";

function defaultSessionDir(): string {
    return join(homedir(), ".brick", "sessions");
}

function generateId(): string {
    return `${Date.now()}-${randomBytes(3).toString("hex")}`;
}

export function createSession(task: string, model: Model): Session {
    return {
        id: generateId(),
        task,
        model: { provider: model.provider, id: model.id },
        startedAt: Date.now(),
        messages: [],
        iterationCount: 0,
    };
}

export async function saveSession(session: Session, dir?: string): Promise<void> {
    const sessionDir = dir ?? defaultSessionDir();
    await mkdir(sessionDir, { recursive: true });
    const path = join(sessionDir, `${session.id}.json`);
    await writeFile(path, JSON.stringify(session, null, 2), "utf-8");
}

export async function loadSession(id: string, dir?: string): Promise<Session> {
    const sessionDir = dir ?? defaultSessionDir();
    const path = join(sessionDir, `${id}.json`);
    const content = await readFile(path, "utf-8");
    return JSON.parse(content) as Session;
}

export async function listSessions(dir?: string): Promise<Session[]> {
    const sessionDir = dir ?? defaultSessionDir();
    let files: string[];
    try {
        files = await readdir(sessionDir);
    } catch {
        return [];
    }
    const sessions: Session[] = [];
    for (const file of files.filter((f) => f.endsWith(".json"))) {
        try {
            const content = await readFile(join(sessionDir, file), "utf-8");
            sessions.push(JSON.parse(content) as Session);
        } catch {
            // skip corrupted session files
        }
    }
    return sessions.sort((a, b) => b.startedAt - a.startedAt);
}
