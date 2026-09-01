// Expose environment variables here.
//
// dotenv-flow is pointed at the package root rather than the working directory,
// because `recipe` is meant to be run from anywhere once it is linked.
import { fileURLToPath } from 'node:url';

import { config as loadEnvFiles } from 'dotenv-flow';

const PACKAGE_ROOT = fileURLToPath(new URL('../../', import.meta.url));

export const NODE_ENV = process.env.NODE_ENV ?? 'development';

loadEnvFiles({ path: PACKAGE_ROOT, node_env: NODE_ENV, silent: true });

export const TEST = NODE_ENV === 'test';
export const RECIPE_API_URL = process.env.RECIPE_API_URL;
export const RECIPE_USERNAME = process.env.RECIPE_USERNAME;
export const RECIPE_PASSWORD = process.env.RECIPE_PASSWORD;
export const RECIPE_SESSION_FILE = process.env.RECIPE_SESSION_FILE;
export const RECIPE_USDA_CACHE_DIR = process.env.RECIPE_USDA_CACHE_DIR;

export interface Config {
    url: string;
    username: string;
    password: string;
    sessionFile?: string;
    usdaCacheDir?: string;
    nodeEnv: string;
}

/**
 * Reads the configuration, throwing when a required value is missing.
 *
 * `urlOverride` is the `--url` flag, which takes precedence over the environment
 * variable, which in turn takes precedence over the env file.
 */
export function loadConfig(urlOverride?: string): Config {
    // Read from process.env at call time, not at import time, so that a caller
    // (or a test) that sets a variable late still sees it.
    const url = urlOverride ?? process.env.RECIPE_API_URL;
    const username = process.env.RECIPE_USERNAME;
    const password = process.env.RECIPE_PASSWORD;
    const required = {
        RECIPE_API_URL: url,
        RECIPE_USERNAME: username,
        RECIPE_PASSWORD: password,
    };
    for (const [key, value] of Object.entries(required)) {
        if (!value) {
            throw new Error(
                `${key} is required. Set it in cli/.env.${NODE_ENV}.local or in the environment.`
            );
        }
    }
    return {
        url: url!,
        username: username!,
        password: password!,
        sessionFile: process.env.RECIPE_SESSION_FILE,
        usdaCacheDir: process.env.RECIPE_USDA_CACHE_DIR,
        nodeEnv: NODE_ENV,
    };
}
