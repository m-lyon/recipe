// Mock environment variables
import { vi } from 'vitest';
export const GRAPHQL_ENDPOINT = vi.fn(() => 'http://localhost:4000/graphql');
export const ROOT_PATH = vi.fn(() => '/recipe');
