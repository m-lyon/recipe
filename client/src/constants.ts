// Expose environment variables here
const GRAPHQL_ENDPOINT = import.meta.env.VITE_GRAPHQL_ENDPOINT;
const ROOT_PATH = import.meta.env.VITE_ROOT_PATH || '/recipe';
export { GRAPHQL_ENDPOINT, ROOT_PATH };