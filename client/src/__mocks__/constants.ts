// Mock environment variables
export const GRAPHQL_ENDPOINT = jest.fn(() => 'http://localhost:4000/graphql');
export const ROOT_PATH = jest.fn(() => '/recipe');