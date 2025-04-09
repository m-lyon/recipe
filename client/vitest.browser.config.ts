import { defineWorkspace } from 'vitest/config';

export default defineWorkspace([
    {
        extends: 'vitest.config.ts',
        test: {
            include: ['**/__tests__/*.browser.{spec,test}.{js,ts,tsx}'],
            browser: {
                enabled: true,
                provider: 'playwright',
                instances: [
                    {
                        browser: 'firefox',
                        headless: true,
                    },
                ],
            },
        },
    },
]);
