#!/usr/bin/env tsx
/**
 * Syncs all workspace package versions to match the root package.json version.
 * Usage: tsx scripts/sync-versions.ts [version]
 *   If version is omitted, uses the current root version.
 */
import { readFileSync, readdirSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";

const root = resolve(import.meta.dirname, "..");

function readJson(path: string): Record<string, unknown> {
    return JSON.parse(readFileSync(path, "utf-8")) as Record<string, unknown>;
}

function writeJson(path: string, data: unknown): void {
    writeFileSync(path, `${JSON.stringify(data, null, 4)}\n`);
}

const rootPkg = readJson(resolve(root, "package.json"));
const version = (process.argv[2] ?? rootPkg.version) as string;

if (!version) {
    console.error("no version found");
    process.exit(1);
}

const workspaces = (rootPkg.workspaces as string[]) ?? [];
const packageNames = new Set<string>();

for (const pattern of workspaces) {
    const dir = resolve(root, pattern.replace("/*", ""));
    for (const entry of readdirSync(dir, { withFileTypes: true })) {
        if (!entry.isDirectory()) continue;
        const pkgPath = resolve(dir, entry.name, "package.json");
        try {
            const pkg = readJson(pkgPath);
            packageNames.add(pkg.name as string);
        } catch {
            // no package.json, skip
        }
    }
}

// update root
rootPkg.version = version;
writeJson(resolve(root, "package.json"), rootPkg);
console.log(`root → ${version}`);

// update each workspace package
for (const pattern of workspaces) {
    const dir = resolve(root, pattern.replace("/*", ""));
    for (const entry of readdirSync(dir, { withFileTypes: true })) {
        if (!entry.isDirectory()) continue;
        const pkgPath = resolve(dir, entry.name, "package.json");
        try {
            const pkg = readJson(pkgPath);
            pkg.version = version;

            // update cross-workspace deps to the new version
            for (const depField of ["dependencies", "devDependencies", "peerDependencies"]) {
                const deps = pkg[depField] as Record<string, string> | undefined;
                if (!deps) continue;
                for (const name of Object.keys(deps)) {
                    if (packageNames.has(name)) {
                        deps[name] = version;
                    }
                }
            }

            writeJson(pkgPath, pkg);
            console.log(`${pkg.name} → ${version}`);
        } catch {
            // no package.json, skip
        }
    }
}
