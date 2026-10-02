import { defineConfig, loadEnv } from 'vite';
import tsconfigPaths from 'vite-tsconfig-paths';

export default defineConfig(({ mode }) => {
    // Served from the site root unless VITE_ROOT_PATH sets a prefix such as '/recipes'
    const root = (loadEnv(mode, process.cwd()).VITE_ROOT_PATH ?? '').replace(/\/+$/, '');
    return {
        base: `${root}/`,
        plugins: [tsconfigPaths()],
    };
});
