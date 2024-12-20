declare global {
    namespace NodeJS {
        interface ProcessEnv {
            GITHUB_AUTH_TOKEN: string;
            NODE_ENV: 'development' | 'production';
            HTTPS?: 'true';
            DELAY?: string;
            PORT?: string;
            MONGODB_URI: string;
            SESSION_SECRET: string;
            SESSION_URI: string;
            WHITELISTED_DOMAINS?: string;
            PRIVKEY_PEM?: string;
            FULLCHAIN_PEM?: string;
            IMAGE_DIR?: string;
        }
    }
}

export {};
