import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { mkdtempSync, rmSync } from 'node:fs';

/** The package root, which @oclif/test needs to load the command tree. */
export const ROOT = fileURLToPath(new URL('../../../', import.meta.url));

let directory: string | undefined;

/** Points the CLI at a fake endpoint and an isolated session cache. */
export function useTestEnvironment(): void {
    directory = mkdtempSync(join(tmpdir(), 'recipe-cli-test-'));
    process.env.RECIPE_API_URL = 'http://api.test/';
    process.env.RECIPE_USERNAME = 'matt';
    process.env.RECIPE_PASSWORD = 'secret';
    process.env.RECIPE_SESSION_FILE = join(directory, 'session');
    process.env.RECIPE_USDA_CACHE_DIR = join(directory, 'usda');
}

export function sessionFile(): string {
    return process.env.RECIPE_SESSION_FILE!;
}

export function usdaCacheDir(): string {
    return process.env.RECIPE_USDA_CACHE_DIR!;
}

export function cleanTestEnvironment(): void {
    if (directory) {
        rmSync(directory, { force: true, recursive: true });
        directory = undefined;
    }
}
