import '@testing-library/jest-dom/extend-expect';

window.matchMedia = (query) => ({
    matches: false,
    media: query,
    onchange: null,
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
    addListener: jest.fn(),
    removeListener: jest.fn(),
});

Object.defineProperty(URL, 'createObjectURL', {
    writable: true,
    value: jest.fn(),
});

// Provides a callable crypto.randomUUID() function for testing
const crypto = require('crypto');
Object.defineProperty(globalThis, 'crypto', {
    value: {
        randomUUID: () => crypto.randomUUID(),
    },
});
