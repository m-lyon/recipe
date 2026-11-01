import { describe, expect, it } from 'vitest';

import manifest from '../../public/manifest.json';

describe('manifest', () => {
    it('uses URLs relative to the base path', () => {
        const urls = [manifest.start_url, manifest.scope, ...manifest.icons.map((i) => i.src)];
        for (const url of urls) {
            expect(url).not.toMatch(/^(\/|[a-z]+:)/i);
        }
    });
});
