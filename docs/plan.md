# brick

a minimal local-first coding agent. no cloud, no api keys required, no bloat.

## what it is

brick is a terminal coding agent that runs on your machine. you point it at a codebase, give it a task, it does the work. that's it.

local models via ollama by default. openai-compatible apis as a fallback. your code never leaves your machine unless you want it to.

## what it isn't

- not a cloud product
- not a platform
- not trying to be claude code or cursor
- not doing anything you couldn't do yourself, just faster

## scope

**v1 — just make it work**
- core agent loop
- basic tools: run commands, read files, write files
- works with ollama out of the box
- sessions saved locally

**later — make it yours**
- context injection via `AGENTS.md` or `BRICK.md`
- skills / prompt templates
- extension points for custom tools

## philosophy

brick does less than the alternatives on purpose. the best tool is the one you understand completely. if something breaks, you should be able to read the source and fix it in an afternoon.

small core. everything else is optional.
