import { homedir } from "node:os";
import { join } from "node:path";

/**
 * XDG Base Directory paths for brick.
 * https://specifications.freedesktop.org/basedir-spec/basedir-spec-latest.html
 */

export function xdgConfigHome(): string {
    return process.env.XDG_CONFIG_HOME ?? join(homedir(), ".config");
}

export function xdgDataHome(): string {
    return process.env.XDG_DATA_HOME ?? join(homedir(), ".local", "share");
}

/** ~/.config/brick or $XDG_CONFIG_HOME/brick */
export function brickConfigDir(): string {
    return join(xdgConfigHome(), "brick");
}

/** ~/.local/share/brick or $XDG_DATA_HOME/brick */
export function brickDataDir(): string {
    return join(xdgDataHome(), "brick");
}
