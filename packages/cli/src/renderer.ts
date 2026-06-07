import type { AgentEvent } from "@brick/agent";

const RESET = "\x1b[0m";
const BOLD = "\x1b[1m";
const DIM = "\x1b[2m";
const RED = "\x1b[31m";
const GREEN = "\x1b[32m";
const YELLOW = "\x1b[33m";
const CLEAR_LINE = "\x1b[2K";

const SPINNER_FRAMES = ["⠋", "⠙", "⠹", "⠸", "⠼", "⠴", "⠦", "⠧", "⠇", "⠏"];

export function write(text: string): void {
    process.stdout.write(text);
}

export function writeLine(text: string): void {
    process.stdout.write(`${text}\n`);
}

export function dim(text: string): string {
    return `${DIM}${text}${RESET}`;
}

export function bold(text: string): string {
    return `${BOLD}${text}${RESET}`;
}

export function green(text: string): string {
    return `${GREEN}${text}${RESET}`;
}

export function red(text: string): string {
    return `${RED}${text}${RESET}`;
}

export function yellow(text: string): string {
    return `${YELLOW}${text}${RESET}`;
}

export function clearLine(): void {
    process.stdout.write(`\r${CLEAR_LINE}`);
}

/**
 * Returns an onEvent callback suitable for passing to runAgent.
 * Handles streaming text, tool spinners, done, and error rendering.
 */
export function makeAgentEventHandler(): (event: AgentEvent) => void {
    let stopSpinner: ((success: boolean) => void) | undefined;

    return (event: AgentEvent): void => {
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
        }
    };
}

export function spinner(label: string): (success: boolean) => void {
    let frame = 0;
    const interval = setInterval(() => {
        const icon = SPINNER_FRAMES[frame % SPINNER_FRAMES.length];
        process.stdout.write(`\r${CLEAR_LINE}${icon} ${label}`);
        frame++;
    }, 80);

    return (success: boolean): void => {
        clearInterval(interval);
        clearLine();
        if (success) {
            writeLine(green(`✓ ${label}`));
        } else {
            writeLine(red(`✗ ${label}`));
        }
    };
}
