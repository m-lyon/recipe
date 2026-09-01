import { Command, Flags } from '@oclif/core';

import { CliError } from './errors.js';
import { loadConfig } from '../constants.js';
import { ApiClient } from '../graphql/client.js';
import { SessionCache, defaultSessionFile } from './session.js';
import { UsdaCache, defaultUsdaCacheDir } from './usdaCache.js';

/**
 * Every command extends this.
 *
 * It owns the transport, the JSON envelope and the warning list, so that the
 * output contract is identical across commands and a stray log line can never
 * corrupt an agent's parse.
 */
export abstract class BaseCommand extends Command {
    static enableJsonFlag = true;

    static baseFlags = {
        url: Flags.string({
            description: 'GraphQL endpoint, taking precedence over RECIPE_API_URL',
            helpValue: 'URL',
        }),
    };

    protected warnings: string[] = [];

    private client?: ApiClient;

    /** Builds the transport. Fails here, before any work, when a variable is missing. */
    protected api(urlOverride?: string): ApiClient {
        if (!this.client) {
            const config = loadConfig(urlOverride);
            const sessionFile = config.sessionFile ?? defaultSessionFile(config.url);
            this.client = new ApiClient(config, new SessionCache(sessionFile), {
                usdaCache: new UsdaCache(config.usdaCacheDir ?? defaultUsdaCacheDir()),
            });
        }
        return this.client;
    }

    /** Collected into the JSON envelope, and printed to stderr otherwise. */
    protected addWarning(message: string): void {
        this.warnings.push(message);
        if (!this.jsonEnabled()) {
            this.warn(message);
        }
    }

    /** Prints a block of table output, but only when --json was not passed. */
    protected out(block: string): void {
        if (!this.jsonEnabled()) {
            this.log(block);
        }
    }

    protected toSuccessJson(result: unknown): unknown {
        return { ok: true, data: result ?? null, warnings: this.warnings };
    }

    protected toErrorJson(error: unknown): unknown {
        const cliError = error as CliError;
        return {
            ok: false,
            error: {
                code: cliError?.errorCode ?? 'RUNTIME',
                message: (error as Error)?.message ?? String(error),
                ...(cliError?.details ?? {}),
            },
        };
    }
}

/** Shared by the commands that read a USDA food item. */
export const usdaFlags = {
    refresh: Flags.boolean({
        description: 'Ignore the cached USDA record and fetch it again',
        default: false,
    }),
};

/** Flags shared by every command that writes. */
export const writeFlags = {
    'dry-run': Flags.boolean({
        description: 'Resolve everything, print the mutation that would be sent, and send nothing',
        default: false,
    }),
};
