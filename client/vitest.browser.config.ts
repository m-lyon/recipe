import { playwright } from '@vitest/browser-playwright';
import { TestProjectInlineConfiguration, defineConfig } from 'vitest/config';

export const browserProjects: TestProjectInlineConfiguration[] = [
    {
        extends: 'vitest.config.ts',
        test: {
            include: ['**/__tests__/*.browser.{spec,test}.{js,ts,tsx}'],
            browser: {
                enabled: true,
                provider: playwright(),
                instances: [
                    {
                        browser: 'firefox',
                        headless: true,
                    },
                ],
            },
        },
    },
];

export default defineConfig({ test: { projects: browserProjects } });
