import { playwright } from '@vitest/browser-playwright';
import { TestProjectInlineConfiguration, defineConfig } from 'vitest/config';

export const browserProjects: TestProjectInlineConfiguration[] = [
    {
        extends: 'vitest.config.ts',
        // Found mid-run otherwise, and the reload that follows loads a second copy of React
        optimizeDeps: { include: ['react/jsx-dev-runtime'] },
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
