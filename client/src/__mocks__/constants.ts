// Mock environment variables
import { vi } from 'vitest';
export const GRAPHQL_ENDPOINT = vi.fn(() => 'http://localhost:4000/');
export const PATH = vi.fn(() => ({ ROOT: '/recipe' }));
