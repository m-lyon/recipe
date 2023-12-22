// Expose environment variables here
import 'dotenv-flow/config';
import { normalisePort } from './utils.js';
const { WHITELISTED_DOMAINS } = process.env;
export const WHITELIST = WHITELISTED_DOMAINS ? WHITELISTED_DOMAINS.split(',') : [];
export const SESSION_SECRET = process.env.SESSION_SECRET;
export const MONGODB_URI = process.env.MONGODB_URI;
export const PORT = process.env.PORT ? normalisePort(process.env.PORT) : 4000;
export const DEV = process.env.NODE_ENV === 'development';
