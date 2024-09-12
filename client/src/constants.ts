// Expose environment variables here
const GRAPHQL_ENDPOINT = import.meta.env.VITE_GRAPHQL_ENDPOINT;
const ROOT_PATH = import.meta.env.VITE_ROOT_PATH || '/recipe';
const DELAY_SHORT = Number(import.meta.env.VITE_DELAY_SHORT) || 1500;
const DELAY_LONG = Number(import.meta.env.VITE_DELAY_LONG) || 3000;
const DEBUG = import.meta.env.VITE_DEBUG || false;
const INIT_LOAD_NUM = Number(import.meta.env.VITE_INIT_LOAD_NUM) || 25;
const FETCH_MORE_NUM = Number(import.meta.env.VITE_FETCH_MORE_NUM) || 10;
const DEBOUNCE_TIME = Number(import.meta.env.VITE_DEBOUNCE_TIME) || 300;
export {
    GRAPHQL_ENDPOINT,
    ROOT_PATH,
    DELAY_SHORT,
    DELAY_LONG,
    DEBUG,
    INIT_LOAD_NUM,
    FETCH_MORE_NUM,
    DEBOUNCE_TIME,
};
