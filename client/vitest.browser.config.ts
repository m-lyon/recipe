import { defineWorkspace } from 'vitest/config';

export default defineWorkspace([
    {
        extends: 'vitest.config.ts',
        test: {
            include: ['**/__tests__/*.browser.{spec,test}.{js,ts,tsx}'],
            browser: {
                enabled: true,
                name: 'firefox',
                provider: 'playwright',
                providerOptions: {},
                headless: true,
            },
        },
    },
]);
