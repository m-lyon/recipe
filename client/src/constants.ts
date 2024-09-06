// Expose environment variables here
const GRAPHQL_ENDPOINT = import.meta.env.VITE_GRAPHQL_ENDPOINT;
const ROOT_PATH = import.meta.env.VITE_ROOT_PATH || '/recipe';
const DELAY_SHORT = import.meta.env.VITE_DELAY_SHORT || 1500;
const DELAY_LONG = import.meta.env.VITE_DELAY_LONG || 3000;
const DEBUG = import.meta.env.VITE_DEBUG || false;
export { GRAPHQL_ENDPOINT, ROOT_PATH, DELAY_SHORT, DELAY_LONG, DEBUG };
