import { defineWorkspace } from 'vitest/config';

import browserWorkspace from './vitest.browser.config.ts';
import defaultWorkspace from './vitest.default.config.ts';

// The VSCode Vitest extension loads a single workspace file. This one combines
// both projects so the Test Explorer shows the happy-dom tests and the browser
// tests together. The `test` and `test:browser` scripts keep using the two
// separate files, so the CLI behaviour is unchanged.
export default defineWorkspace([...defaultWorkspace, ...browserWorkspace]);
