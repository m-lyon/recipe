import { join } from 'node:path';
import { homedir } from 'node:os';
import { createHash } from 'node:crypto';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';

/**
 * USDA records are effectively static, but the API's mapping of them is not.
 * An entry older than this is re-fetched, so a resolver change cannot leave a
 * wrong value on disk indefinitely.
 */
export const CACHE_TTL_MS = 30 * 24 * 60 * 60 * 1000;

interface CacheEntry {
    fetchedAt: number;
    fdcId: number;
    result: unknown;
}

export function defaultUsdaCacheDir(): string {
    return join(homedir(), '.cache', 'recipe-cli', 'usda');
}

/**
 * `usdaFoodItem` responses on disk, keyed by fdcId.
 *
 * USDA calls pass through the API and consume the server's key quota, and the
 * in-process cache does not survive between commands. Without this, `usda show`
 * followed by a dry run and then a write costs three upstream calls for one
 * food.
 *
 * The key carries a hash of the GraphQL document, so editing the operation
 * invalidates every entry it wrote. The data is public, so the files are not
 * given restrictive permissions.
 */
export class UsdaCache {
    readonly directory: string;

    private readonly ttlMs: number;

    constructor(directory: string, ttlMs: number = CACHE_TTL_MS) {
        this.directory = directory;
        this.ttlMs = ttlMs;
    }

    /** Returns the cached result, or null on a miss, a stale entry or an unreadable file. */
    read<TResult>(fdcId: number, fingerprint: string): TResult | null {
        try {
            const entry = JSON.parse(
                readFileSync(this.file(fdcId, fingerprint), 'utf8')
            ) as CacheEntry;
            if (entry.fdcId !== fdcId) return null;
            if (Date.now() - entry.fetchedAt > this.ttlMs) return null;
            return entry.result as TResult;
        } catch {
            // A missing, truncated or hand-edited file is a miss, never an error.
            return null;
        }
    }

    write(fdcId: number, fingerprint: string, result: unknown): void {
        try {
            mkdirSync(this.directory, { recursive: true, mode: 0o700 });
            const entry: CacheEntry = { fetchedAt: Date.now(), fdcId, result };
            writeFileSync(this.file(fdcId, fingerprint), JSON.stringify(entry), 'utf8');
        } catch {
            // A cache that cannot be written costs a round trip, nothing more.
        }
    }

    file(fdcId: number, fingerprint: string): string {
        return join(this.directory, `${fdcId}-${fingerprint}.json`);
    }
}

/** A short, stable hash of the query text a result was produced from. */
export function fingerprint(query: string): string {
    return createHash('sha256').update(query).digest('hex').slice(0, 8);
}
