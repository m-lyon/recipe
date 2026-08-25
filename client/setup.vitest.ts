import { vi } from 'vitest';
import '@testing-library/jest-dom/vitest';
vi.mock('zustand');
vi.mock('lottie-react', () => ({ default: () => null }));
