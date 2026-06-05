import type {
    AssistantMessage,
    Context,
    Message,
    Model,
    StreamHandle,
    StreamOptions,
} from "@brick/ai";

// Injected stream function — real by default, replaceable in tests.
export type StreamFn = (model: Model, context: Context, options?: StreamOptions) => StreamHandle;

// Events emitted by the agent loop to the caller.
export type AgentEvent =
    | { type: "text"; delta: string }
    | { type: "tool_start"; name: string; arguments: Record<string, unknown> }
    | { type: "tool_end"; name: string; result: string; isError: boolean }
    | { type: "done"; message: AssistantMessage }
    | { type: "error"; message: string };

export interface AgentOptions {
    maxIterations?: number;
    onEvent?: (event: AgentEvent) => void;
    /** Working directory for tool execution. Defaults to process.cwd(). */
    cwd?: string;
    /** Where sessions are saved. Defaults to ~/.brick/sessions. */
    sessionDir?: string;
    /** Override the stream function. Used in tests. */
    streamFn?: StreamFn;
    signal?: AbortSignal;
}

export interface Session {
    id: string;
    task: string;
    model: { provider: string; id: string };
    startedAt: number;
    endedAt?: number;
    messages: Message[];
    iterationCount: number;
}

export interface AgentResult {
    session: Session;
    finalMessage: AssistantMessage;
}
