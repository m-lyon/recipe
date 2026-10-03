import { TestProjectInlineConfiguration, defineConfig } from 'vitest/config';

export const defaultProjects: TestProjectInlineConfiguration[] = [
    {
        extends: 'vitest.config.ts',
        test: {
            include: ['**/__tests__/*.{spec,test}.{js,ts,tsx}'],
            exclude: [
                '**/__tests__/*.browser.{spec,test}.{js,ts,tsx}',
                '**/node_modules/**',
                '**/dist/**',
                '**/cypress/**',
                '**/.{idea,git,cache,output,temp}/**',
                '**/{karma,rollup,webpack,vite,vitest,jest,ava,babel,nyc,cypress,tsup,build}.config.*',
            ],
        },
    },
];

export default defineConfig({ test: { projects: defaultProjects } });
