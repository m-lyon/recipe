import { Errors } from '@oclif/core';

/** Exit codes. Documented in cli/README.md and cli/AGENTS.md. */
export const ExitCode = {
    /** runtime or network error */
    RUNTIME: 1,
    /** usage error (oclif default) */
    USAGE: 2,
    /** not authenticated, or insufficient role */
    AUTH: 3,
    /** not found, or an ambiguous identifier */
    NOT_FOUND: 4,
    /** refused: existing data would be replaced, and --overwrite was not given */
    WOULD_OVERWRITE: 5,
    /** the server rejected the write, or the CLI rejected the arguments to one */
    REJECTED: 6,
} as const;

/**
 * An error with a machine-readable code and an exit code.
 *
 * `oclif.exit` drives the exit code on the table path, `exitCode` on the --json
 * path; @oclif/core reads a different property in each.
 */
export class CliError extends Errors.CLIError {
    readonly errorCode: string;
    readonly exitCode: number;
    readonly details?: Record<string, unknown>;

    constructor(
        message: string,
        errorCode: string,
        exitCode: number,
        details?: Record<string, unknown>
    ) {
        super(message, { exit: exitCode });
        this.errorCode = errorCode;
        this.exitCode = exitCode;
        this.details = details;
    }
}

export function notAuthenticated(message: string): CliError {
    return new CliError(message, 'NOT_AUTHENTICATED', ExitCode.AUTH);
}

export function forbidden(message: string): CliError {
    return new CliError(message, 'FORBIDDEN', ExitCode.AUTH);
}

export function notFound(message: string, details?: Record<string, unknown>): CliError {
    return new CliError(message, 'NOT_FOUND', ExitCode.NOT_FOUND, details);
}

export function ambiguous(message: string, candidates: unknown[]): CliError {
    return new CliError(message, 'AMBIGUOUS', ExitCode.NOT_FOUND, { candidates });
}

export function wouldOverwrite(message: string, existing: unknown): CliError {
    return new CliError(message, 'WOULD_OVERWRITE', ExitCode.WOULD_OVERWRITE, { existing });
}

export function rejected(message: string, details?: Record<string, unknown>): CliError {
    return new CliError(message, 'BAD_USER_INPUT', ExitCode.REJECTED, details);
}

export function runtime(message: string): CliError {
    return new CliError(message, 'RUNTIME', ExitCode.RUNTIME);
}

/** Maps a GraphQL error's `extensions.code` onto a CliError. */
export function fromGraphQLCode(code: string | undefined, message: string): CliError {
    switch (code) {
        case 'UNAUTHENTICATED': {
            return notAuthenticated(message);
        }
        case 'FORBIDDEN': {
            return forbidden(message);
        }
        case 'NOT_FOUND': {
            return notFound(message);
        }
        case 'BAD_USER_INPUT':
        case 'GRAPHQL_VALIDATION_FAILED': {
            return rejected(message);
        }
        default: {
            return runtime(message);
        }
    }
}
