import { defineWorkspace } from 'vitest/config';

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
                headless: false,
            },
            name: 'browser',
            unstubGlobals: true,
        },
    },
]);
