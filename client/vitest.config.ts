import { defineConfig, mergeConfig } from 'vitest/config';

import viteConfig from './vite.config.ts';

export default mergeConfig(
    viteConfig,
    defineConfig({
        test: { environment: 'happy-dom', css: true, testTimeout: 15000 },
    })
);
