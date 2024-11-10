import { defineWorkspace } from 'vitest/config';
import { nodePolyfills } from 'vite-plugin-node-polyfills';

export default defineWorkspace([
    {
        extends: 'vitest.config.js',
        test: {
            include: ['**/__tests__/browser/*.{spec,test}.{js,ts,tsx}'],
            exclude: ['**/__tests__/*.{spec,test}.{js,ts,tsx}'],
            browser: {
                enabled: true,
                name: 'chromium',
                provider: 'playwright',
                headless: true,
            },
            name: 'browser',
            unstubGlobals: true,
        },
        plugins: [nodePolyfills()],
    },
]);
