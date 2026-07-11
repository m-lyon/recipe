import { renderHook } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { useStandalone } from '@recipe/common/hooks';

function mockMatchMedia(matches: boolean) {
    vi.spyOn(window, 'matchMedia').mockReturnValue({
        matches,
        media: '(display-mode: standalone)',
        onchange: null,
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        addListener: vi.fn(),
        removeListener: vi.fn(),
        dispatchEvent: vi.fn(),
    } as unknown as MediaQueryList);
}

describe('useStandalone', () => {
    afterEach(() => {
        vi.restoreAllMocks();
        Object.defineProperty(window.navigator, 'standalone', {
            value: undefined,
            configurable: true,
        });
    });

    it('returns true when the display-mode standalone media query matches', () => {
        mockMatchMedia(true);
        const { result } = renderHook(() => useStandalone());
        expect(result.current).toBe(true);
    });

    it('returns true when navigator.standalone is set (iOS)', () => {
        mockMatchMedia(false);
        Object.defineProperty(window.navigator, 'standalone', {
            value: true,
            configurable: true,
        });
        const { result } = renderHook(() => useStandalone());
        expect(result.current).toBe(true);
    });

    it('returns false in a normal browser', () => {
        mockMatchMedia(false);
        const { result } = renderHook(() => useStandalone());
        expect(result.current).toBe(false);
    });
});
