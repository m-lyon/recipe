import { defineConfig, mergeConfig } from 'vitest/config';

import viteConfig from './vite.config.ts';

export default mergeConfig(
    viteConfig,
    defineConfig({
        test: {
            environment: 'happy-dom',
            setupFiles: ['./config/vitest/setupTests.js'],
            css: true,
            testTimeout: 15000,
        },
    })
);
