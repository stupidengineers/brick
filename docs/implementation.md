# brick — implementation plan

A phased build of a minimal local-first coding agent. Each phase is independently shippable and testable. You build it in order, understand what you have at each step, then move on.

---

## folder structure (final target)

```
brick/
├── packages/
│   ├── ai/              # phase 2 — LLM API layer (ollama + openai-compat)
│   ├── agent/           # phase 3 — tool loop and state
│   └── cli/             # phase 4 — interactive terminal interface
├── scripts/
│   └── sync-versions.ts # keep package versions in lockstep
├── test.sh              # phase 1 — run all tests
├── brick.sh             # phase 4 — run cli from source
├── package.json         # root workspace
├── tsconfig.base.json   # shared ts config
├── tsconfig.json        # dev (path aliases)
├── biome.json           # linting + formatting
├── .npmrc               # save-exact=true, min-release-age=2
├── .husky/
│   └── pre-commit       # runs check before every commit
└── AGENTS.md
```

---

## phase 1 — monorepo scaffold

**what you build:** the skeleton. nothing runs yet but everything compiles and lints.

**deliverables:**
- root `package.json` with npm workspaces pointing at `packages/*`
- `biome.json` — linting + formatting (replaces eslint + prettier)
- `tsconfig.base.json` — strict mode, `NodeNext` modules, `exactOptionalPropertyTypes`
- `tsconfig.json` — extends base, adds path aliases for workspace packages
- `.npmrc` — `save-exact=true`, `min-release-age=2`
- `.husky/pre-commit` — runs `npm run check` before every commit
- `test.sh` — discovers and runs all `*.test.ts` files via `tsx`
- `scripts/sync-versions.ts` — bumps all workspace package versions together
- each package gets: `package.json`, `tsconfig.json`, `tsconfig.build.json`, `src/index.ts`
- root `package.json` scripts: `build`, `check` (lint + format + typecheck), `test`

**verify:** `npm run check` passes. `./test.sh` runs (no tests yet, exits 0).

---

## phase 2 — `packages/ai`

**what you build:** a thin, typed wrapper over the OpenAI-compatible chat completions API. This is the only network layer in the whole project.

**scope (deliberately narrow):**
- `getModel(provider, modelId)` — returns a typed `Model` object
- `stream(model, context)` — returns an async iterable of typed events
- `complete(model, context)` — awaits full response
- typed events: `text_delta`, `text_end`, `toolcall_end`, `done`, `error`
- typed `Context`: `{ systemPrompt?, messages, tools? }`
- typed `Tool`: name + description + TypeBox parameter schema
- `validateToolCall(tools, call)` — validates args against schema, throws on mismatch
- token + cost tracking on every response
- abort signal support

**providers supported at this phase:**
- `ollama` (local, no key required — default)
- `openai` (openai-compat fallback)
- any custom base URL via `{ provider: 'custom', baseUrl: '...' }`

**dependencies:**
- `@sinclair/typebox` — schema definitions and validation
- no other runtime deps (raw `fetch`)

**tests (`packages/ai/test/`):**
- `stream.test.ts` — basic streaming, text arrives, done fires
- `toolcall.test.ts` — model emits tool call, arguments parsed correctly
- `abort.test.ts` — abort signal cancels mid-stream
- `validate.test.ts` — `validateToolCall` rejects bad args, accepts good ones
- `tokens.test.ts` — usage fields present on done event

tests run against a real ollama instance if `OLLAMA_HOST` is set, otherwise skip with a clear message. no mocks.

**verify:** `npm run check`. `./test.sh` runs ai tests.

---

## phase 3 — `packages/agent`

**what you build:** the agent loop. takes a task, runs tools, keeps going until done or stuck.

**scope:**
- `runAgent(task, tools, model, options)` — main entry point
- the loop: call model → if tool call → execute tool → push result → repeat → until `stop` reason
- built-in tools:
  - `read_file(path)` — reads a file, returns content
  - `write_file(path, content)` — writes a file
  - `run_command(command, cwd?)` — runs a shell command, returns stdout/stderr/exit code
  - `list_directory(path)` — lists directory contents
  - `search_files(pattern, directory?)` — ripgrep wrapper
- `Session` type: serializable record of the full run (messages, tool calls, results)
- sessions saved to `~/.brick/sessions/<id>.json`
- `onEvent` callback for streaming updates out to the caller
- max iterations cap (default 50) to prevent runaway loops

**agent events (emitted via `onEvent`):**
- `text` — model is writing
- `tool_start` — about to execute a tool
- `tool_end` — tool finished, here's the result
- `done` — agent finished
- `error` — something went wrong

**dependencies:**
- `packages/ai` (workspace)

**tests (`packages/agent/test/`):**
- `loop.test.ts` — single tool call round trip completes
- `multi-turn.test.ts` — agent calls multiple tools in sequence
- `max-iterations.test.ts` — loop stops at cap, emits error event
- `session.test.ts` — session is written to disk, can be loaded back
- `tools.test.ts` — each built-in tool works in isolation

tests use a fake model (no real LLM calls) that returns scripted responses. one integration test that uses a real ollama model if `OLLAMA_HOST` is set.

**verify:** `npm run check`. `./test.sh` runs ai + agent tests.

---

## phase 4 — `packages/cli`

**what you build:** the terminal interface. this is what the user actually runs.

**scope:**
- `brick` binary — entry point
- interactive mode: `brick` — starts a REPL session
- one-shot mode: `brick "refactor this file to use async/await"` — runs and exits
- `--model` flag to pick model
- `--cwd` flag to set working directory (defaults to `process.cwd()`)
- `--session` flag to resume a saved session
- terminal output: streaming text, tool call spinners, final summary
- reads `BRICK.md` or `AGENTS.md` from cwd if present and injects as system prompt context
- `brick models` subcommand — lists available models from configured providers
- `brick sessions` subcommand — lists saved sessions

**terminal rendering:**
- no framework (no Ink, no blessed)
- raw terminal writes: `process.stdout.write`
- a tiny internal renderer: cursor up/overwrite for spinners, color via ANSI codes
- keep it under 200 lines

**config** (`~/.brick/config.json`):
```json
{
  "defaultModel": "ollama/qwen2.5-coder:7b",
  "ollamaHost": "http://localhost:11434",
  "providers": {}
}
```

**dependencies:**
- `packages/ai` (workspace)
- `packages/agent` (workspace)

**tests (`packages/cli/test/`):**
- `args.test.ts` — flag parsing
- `config.test.ts` — config load, defaults applied, missing file handled
- `output.test.ts` — event → terminal string formatting

**verify:** `npm run check`. `./test.sh` all tests pass. `./brick.sh "list the files in this directory"` works end to end.

---

## cross-cutting conventions (apply from phase 1)

**typescript:**
- `strict: true`, `exactOptionalPropertyTypes: true`, `noUncheckedIndexedAccess: true`
- `NodeNext` module resolution throughout
- no `any`, no type assertions without a comment explaining why
- all public API types exported from `src/index.ts`

**biome config:**
- extends recommended
- double quotes, 4-space indent (match pi's style)
- import sorting enabled
- no unused variables, no `console.log` in library code (only in cli)

**testing conventions:**
- test files in `packages/<name>/test/`
- file name matches what it tests: `stream.test.ts` tests the stream function
- no test framework — plain `async` functions, `assert` from node stdlib
- `test.sh` finds all `*.test.ts` files and runs them with `tsx`, collects exit codes
- a test file exits 0 on pass, non-zero on failure
- each test prints `ok: <description>` or `FAIL: <description>\n<error>`

**git hygiene:**
- husky pre-commit runs `npm run check` (lint + format + typecheck)
- lockfile changes blocked unless `BRICK_ALLOW_LOCKFILE_CHANGE=1`
- all direct deps pinned to exact versions

---

## what you do not build

- no web UI
- no cloud sync
- no plugin system (yet)
- no model fine-tuning
- no telemetry
- no auto-update

---

## success criteria per phase

| phase | you know it's done when... |
|-------|---------------------------|
| 1 | `npm run check` and `./test.sh` pass on a clean clone |
| 2 | you can stream a response from ollama with tool call support in a standalone script |
| 3 | `runAgent("list the files in src/")` writes to a session file and returns the right answer |
| 4 | `./brick.sh "what files are in this directory"` prints the answer in the terminal |
