import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { existsSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';

import { expect } from 'chai';

import { EGG } from './helpers/fixtures.js';
import { CACHE_TTL_MS, UsdaCache, fingerprint } from '../src/lib/usdaCache.js';

describe('USDA disk cache', () => {
    let directory: string;
    let cache: UsdaCache;
    const key = fingerprint('query UsdaFoodItem { ... }');

    beforeEach(() => {
        directory = mkdtempSync(join(tmpdir(), 'recipe-cli-usda-'));
        cache = new UsdaCache(directory);
    });
    afterEach(() => {
        rmSync(directory, { force: true, recursive: true });
    });

    it('misses before anything is written', () => {
        expect(cache.read(171287, key)).to.equal(null);
    });

    it('writes an entry and reads it back', () => {
        cache.write(171287, key, { usdaFoodItem: EGG });
        expect(existsSync(cache.file(171287, key))).to.equal(true);
        expect(cache.read<{ usdaFoodItem: typeof EGG }>(171287, key)?.usdaFoodItem.fdcId).to.equal(
            171287
        );
    });

    it('misses when the query fingerprint differs, so an edited operation invalidates it', () => {
        cache.write(171287, key, { usdaFoodItem: EGG });
        expect(cache.read(171287, fingerprint('a different query'))).to.equal(null);
    });

    it('misses for a different fdcId', () => {
        cache.write(171287, key, { usdaFoodItem: EGG });
        expect(cache.read(171413, key)).to.equal(null);
    });

    it('treats an entry past its TTL as a miss', () => {
        const expiring = new UsdaCache(directory, -1);
        expiring.write(171287, key, { usdaFoodItem: EGG });
        expect(expiring.read(171287, key)).to.equal(null);
        // The default TTL is long, because USDA records are effectively static.
        expect(CACHE_TTL_MS).to.be.greaterThan(24 * 60 * 60 * 1000);
    });

    it('treats an unreadable file as a miss rather than an error', () => {
        cache.write(171287, key, { usdaFoodItem: EGG });
        writeFileSync(cache.file(171287, key), 'not json');
        expect(cache.read(171287, key)).to.equal(null);
    });

    it('survives an unwritable directory without throwing', () => {
        // A regular file where a parent directory is expected: mkdir gives ENOTDIR.
        const blocker = join(directory, 'blocker');
        writeFileSync(blocker, 'not a directory');
        const unwritable = new UsdaCache(join(blocker, 'usda'));
        expect(() => unwritable.write(1, key, {})).to.not.throw();
        expect(unwritable.read(1, key)).to.equal(null);
    });

    it('stores the fetch time, so staleness can be judged', () => {
        cache.write(171287, key, { usdaFoodItem: EGG });
        const raw = JSON.parse(readFileSync(cache.file(171287, key), 'utf8'));
        expect(raw.fetchedAt).to.be.a('number');
        expect(raw.fdcId).to.equal(171287);
    });
});
