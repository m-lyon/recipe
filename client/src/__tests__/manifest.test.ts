import { describe, expect, it } from 'vitest';

import manifest from '../../public/manifest.json';

// Production serves the app from the site root and other builds under VITE_ROOT_PATH, so an
// absolute URL is wrong for one of them. Relative URLs resolve against the manifest URL,
// which Vite puts under the base path.
describe('manifest', () => {
    it('uses URLs relative to the base path', () => {
        const urls = [manifest.start_url, manifest.scope, ...manifest.icons.map((i) => i.src)];
        for (const url of urls) {
            expect(url).not.toMatch(/^(\/|[a-z]+:)/i);
        }
    });
});
