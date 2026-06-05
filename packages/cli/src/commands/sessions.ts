import { listSessions } from "@brick/agent";
import { dim, writeLine } from "../renderer.js";

function formatDate(ts: number): string {
    const d = new Date(ts);
    const month = d.toLocaleString("default", { month: "short" });
    const day = d.getDate();
    const hours = String(d.getHours()).padStart(2, "0");
    const minutes = String(d.getMinutes()).padStart(2, "0");
    return `${month} ${day}, ${hours}:${minutes}`;
}

function truncate(text: string, max: number): string {
    if (text.length <= max) return text;
    return `${text.slice(0, max - 1)}…`;
}

export async function runSessions(): Promise<void> {
    const sessions = await listSessions();
    if (sessions.length === 0) {
        writeLine(dim("no sessions found"));
        return;
    }
    for (const session of sessions) {
        const id = dim(session.id);
        const date = formatDate(session.startedAt);
        const task = truncate(session.task, 60);
        const iters = dim(`(${session.iterationCount} iterations)`);
        writeLine(`${id}   ${date}   ${task}   ${iters}`);
    }
}
