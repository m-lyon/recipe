// Expose environment variables here
import 'dotenv-flow/config';
import { normalisePort } from './utils/port.js';

const { WHITELISTED_DOMAINS } = process.env;
export const DEV = process.env.NODE_ENV === 'development';
export const TEST = process.env.NODE_ENV === 'test';
export const HTTPS = process.env.HTTPS === 'true';
export const DELAY = process.env.DELAY ? parseInt(process.env.DELAY) : 0;
export const WHITELIST = WHITELISTED_DOMAINS ? WHITELISTED_DOMAINS.split(',') : [];
export const SESSION_SECRET = process.env.SESSION_SECRET;
export const SESSION_URI = process.env.SESSION_URI;
export const MONGODB_URI = process.env.MONGODB_URI;
export const PORT = process.env.PORT ? normalisePort(process.env.PORT) : 4000;
export const PRIVKEY_PEM = process.env.PRIVKEY_PEM;
export const FULLCHAIN_PEM = process.env.FULLCHAIN_PEM;
export const IMAGE_DIR = process.env.IMAGE_DIR ? process.env.IMAGE_DIR : '/data/recipe/images';
export const SMTP_FROM_DOMAIN = process.env.SMTP_FROM_DOMAIN;
export const SMTP_ADMIN_EMAIL = process.env.SMTP_ADMIN_EMAIL;
export const SENDGRID_API_KEY = process.env.SENDGRID_API_KEY;

if (!TEST) {
    const requiredEnvVars = {
        SESSION_SECRET,
        SESSION_URI,
        SMTP_FROM_DOMAIN,
        SMTP_ADMIN_EMAIL,
        SENDGRID_API_KEY,
        MONGODB_URI,
    };
    for (const [key, value] of Object.entries(requiredEnvVars)) {
        if (!value) {
            throw new Error(`${key} is required`);
        }
    }
}
if (HTTPS) {
    const requiredEnvVars = { PRIVKEY_PEM, FULLCHAIN_PEM };
    for (const [key, value] of Object.entries(requiredEnvVars)) {
        if (!value) {
            throw new Error(`${key} is required for HTTPS`);
        }
    }
}
