declare global {
    namespace NodeJS {
        interface ProcessEnv {
            NODE_ENV: 'development' | 'production' | 'test';
            HOST?: string;
            DELAY?: string;
            PORT?: string;
            MONGODB_URI: string;
            SESSION_SECRET?: string;
            SESSION_URI?: string;
            WHITELISTED_DOMAINS?: string;
            IMAGE_DIR?: string;
            SMTP_FROM_DOMAIN?: string;
            SMTP_ADMIN_EMAIL?: string;
            SENDGRID_API_KEY?: string;
            USDA_API_KEY?: string;
        }
    }
}

export {};
