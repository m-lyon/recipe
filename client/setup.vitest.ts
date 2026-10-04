import { afterEach, vi } from 'vitest';
import '@testing-library/jest-dom/vitest';
vi.mock('zustand');
vi.mock('lottie-react', () => ({ default: () => null }));

// happy-dom's Element.animate rejects each cancelled animation's `finished` promise without
// marking it handled, as browsers do. framer-motion cancels animations constantly, so make it
// fall back to its JS animations, as it did before happy-dom implemented Element.animate.
if ('happyDOM' in window) {
    delete (Element.prototype as Partial<Element>).animate;
}

// Drafts and the last route persist in localStorage; keep each test independent.
afterEach(() => {
    localStorage.clear();
});
