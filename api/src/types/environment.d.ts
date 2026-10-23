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
            OPEN_FOOD_FACTS_API_URL?: string;
            OPEN_FOOD_FACTS_SEARCH_URL?: string;
            OPEN_FOOD_FACTS_CONTACT?: string;
            OPEN_FOOD_FACTS_WRITE_URL?: string;
            OPEN_FOOD_FACTS_USER_ID?: string;
            OPEN_FOOD_FACTS_PASSWORD?: string;
            OPEN_FOOD_FACTS_APP_UUID_SALT?: string;
        }
    }
}

export {};
