#!/usr/bin/env node
import { parseArgs, printHelp } from "./args.js";
import { runModels } from "./commands/models.js";
import { runSessions } from "./commands/sessions.js";
import { runInteractive } from "./modes/interactive.js";
import { runOneShot } from "./modes/oneshot.js";

const args = parseArgs(process.argv.slice(2));
if (args.help) {
    printHelp();
    process.exit(0);
}

if (args.subcommand === "interactive") {
    await runInteractive(args);
}
if (args.subcommand === "oneshot" && args.task) {
    await runOneShot(args.task, args);
}
if (args.subcommand === "sessions") {
    await runSessions();
}
if (args.subcommand === "models") {
    await runModels();
}
