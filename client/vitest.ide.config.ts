import { defineConfig } from 'vitest/config';

import { browserProjects } from './vitest.browser.config.ts';
import { defaultProjects } from './vitest.default.config.ts';

// The VSCode Vitest extension loads a single config file. This one combines
// both projects so the Test Explorer shows the happy-dom tests and the browser
// tests together. The `test` and `test:browser` scripts keep using the two
// separate files, so the CLI behaviour is unchanged.
export default defineConfig({ test: { projects: [...defaultProjects, ...browserProjects] } });
