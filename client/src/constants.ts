// Expose environment variables here
const TEST = import.meta.env.MODE === 'test';
const ROOT = import.meta.env.VITE_ROOT_PATH || '/recipe';
const LOGIN_ENDPOINT = import.meta.env.VITE_LOGIN_ENDPOINT || 'login';
const LOGIN = `${ROOT}/${LOGIN_ENDPOINT}`;
export const GRAPHQL_URL = import.meta.env.VITE_GRAPHQL_URL;
export const PATH = { ROOT, LOGIN_ENDPOINT, LOGIN };
export const DELAY_SHORT = Number(import.meta.env.VITE_DELAY_SHORT) || 1500;
export const DELAY_LONG = Number(import.meta.env.VITE_DELAY_LONG) || 3000;
export const DEBUG = import.meta.env.VITE_DEBUG || false;
export const INIT_LOAD_NUM = Number(import.meta.env.VITE_INIT_LOAD_NUM) || 25;
export const FETCH_MORE_NUM = Number(import.meta.env.VITE_FETCH_MORE_NUM) || 10;
export const DEBOUNCE_TIME = Number(import.meta.env.VITE_DEBOUNCE_TIME) || 300;

if (!TEST) {
    const requiredEnvVars = { GRAPHQL_URL };
    for (const [key, value] of Object.entries(requiredEnvVars)) {
        if (!value) {
            throw new Error(`${key} is required`);
        }
    }
}
