// Expose environment variables here
import 'dotenv-flow/config';
import { normalisePort } from './utils/port.js';

const { WHITELISTED_DOMAINS } = process.env;
export const WHITELIST = WHITELISTED_DOMAINS ? WHITELISTED_DOMAINS.split(',') : [];
export const SESSION_SECRET = process.env.SESSION_SECRET;
export const SESSION_URI = process.env.SESSION_URI;
export const MONGODB_URI = process.env.MONGODB_URI;
export const PORT = process.env.PORT ? normalisePort(process.env.PORT) : 4000;
export const DEV = process.env.NODE_ENV === 'development';
export const PRIVKEY_PEM = process.env.PRIVKEY_PEM;
export const FULLCHAIN_PEM = process.env.FULLCHAIN_PEM;
export const IMAGE_DIR = process.env.IMAGE_DIR ? process.env.IMAGE_DIR : '/data/recipe/images';
export const IMAGE_DIR_URL = process.env.IMAGE_DIR_URL;
