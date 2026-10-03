import { defineConfig, loadEnv } from 'vite';
import tsconfigPaths from 'vite-tsconfig-paths';

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, process.cwd());
    // Served from the site root unless VITE_ROOT_PATH sets a prefix such as '/recipes'
    const root = (env.VITE_ROOT_PATH ?? '').replace(/\/+$/, '');
    // VITE_PORT is set per git worktree, so a fallback port would miss the API's CORS whitelist
    const port = env.VITE_PORT ? Number(env.VITE_PORT) : undefined;
    return {
        base: `${root}/`,
        plugins: [tsconfigPaths()],
        server: { port, strictPort: port !== undefined },
    };
});
