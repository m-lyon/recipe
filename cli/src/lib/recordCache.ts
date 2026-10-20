import { join } from 'node:path';
import { homedir } from 'node:os';
import { createHash } from 'node:crypto';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';

/**
 * USDA and Open Food Facts records change rarely, but the API's mapping of them
 * does change. An entry older than this is re-fetched, so a resolver change
 * cannot leave a wrong value on disk indefinitely.
 */
export const CACHE_TTL_MS = 30 * 24 * 60 * 60 * 1000;

/** The sources whose records are cached, one directory each. */
export type CachedSource = 'usda' | 'off';

interface CacheEntry {
    fetchedAt: number;
    id: string;
    result: unknown;
}

export function defaultCacheDir(source: CachedSource): string {
    return join(homedir(), '.cache', 'recipe-cli', source);
}

/**
 * Food records on disk, keyed by their id in the source: a USDA fdcId or an
 * Open Food Facts barcode.
 *
 * Reads pass through the API and spend limits that the whole server shares,
 * and the in-process cache does not survive between commands. Without this,
 * `usda show` followed by a dry run and then a write costs three upstream calls
 * for one food.
 *
 * The key carries a hash of the GraphQL document, so editing the operation
 * invalidates every entry it wrote. The data is public, so the files are not
 * given restrictive permissions.
 */
export class RecordCache {
    readonly directory: string;

    private readonly ttlMs: number;

    constructor(directory: string, ttlMs: number = CACHE_TTL_MS) {
        this.directory = directory;
        this.ttlMs = ttlMs;
    }

    /** Returns the cached result, or null on a miss, a stale entry or an unreadable file. */
    read<TResult>(id: string | number, fingerprint: string): TResult | null {
        try {
            const entry = JSON.parse(
                readFileSync(this.file(id, fingerprint), 'utf8')
            ) as CacheEntry;
            if (entry.id !== String(id)) return null;
            if (Date.now() - entry.fetchedAt > this.ttlMs) return null;
            return entry.result as TResult;
        } catch {
            // A missing, truncated or hand-edited file is a miss, never an error.
            return null;
        }
    }

    write(id: string | number, fingerprint: string, result: unknown): void {
        try {
            mkdirSync(this.directory, { recursive: true, mode: 0o700 });
            const entry: CacheEntry = { fetchedAt: Date.now(), id: String(id), result };
            writeFileSync(this.file(id, fingerprint), JSON.stringify(entry), 'utf8');
        } catch {
            // A cache that cannot be written costs a round trip, nothing more.
        }
    }

    file(id: string | number, fingerprint: string): string {
        return join(this.directory, `${id}-${fingerprint}.json`);
    }
}

/** A short, stable hash of the query text a result was produced from. */
export function fingerprint(query: string): string {
    return createHash('sha256').update(query).digest('hex').slice(0, 8);
}
