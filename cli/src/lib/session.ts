import { join } from 'node:path';
import { homedir } from 'node:os';
import { createHash } from 'node:crypto';
import { chmodSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';

const COOKIE_NAME = 'connect.sid';

/**
 * The cache is keyed by API URL so that a development target and a production
 * target never share a session.
 */
export function defaultSessionFile(url: string): string {
    const hash = createHash('sha256').update(url).digest('hex').slice(0, 16);
    return join(homedir(), '.cache', 'recipe-cli', `session-${hash}`);
}

/**
 * One cookie string on disk, mode 0600.
 *
 * This is a pure optimisation: deleting the file costs one extra round trip on
 * the next command and nothing else.
 */
export class SessionCache {
    readonly file: string;

    constructor(file: string) {
        this.file = file;
    }

    read(): string | null {
        try {
            const contents = readFileSync(this.file, 'utf8').trim();
            return contents.length > 0 ? contents : null;
        } catch {
            return null;
        }
    }

    write(cookie: string): void {
        try {
            mkdirSync(join(this.file, '..'), { recursive: true, mode: 0o700 });
            writeFileSync(this.file, cookie, { encoding: 'utf8', mode: 0o600 });
            // writeFileSync only applies `mode` when it creates the file, so an
            // existing file keeps whatever permissions it had.
            chmodSync(this.file, 0o600);
        } catch {
            // A cache that cannot be written is not an error. The next command
            // authenticates again.
        }
    }

    clear(): void {
        try {
            rmSync(this.file, { force: true });
        } catch {
            // Nothing to do; see write().
        }
    }
}

/** Picks the session cookie out of a Set-Cookie header list. */
export function extractSessionCookie(setCookies: string[]): string | null {
    for (const header of setCookies) {
        const pair = header.split(';')[0];
        if (pair.startsWith(`${COOKIE_NAME}=`)) {
            return pair;
        }
    }
    return null;
}
