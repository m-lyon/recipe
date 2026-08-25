import { act, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { useMinimumLoading } from '@recipe/common/hooks';

describe('useMinimumLoading', () => {
    beforeEach(() => {
        vi.useFakeTimers();
    });

    afterEach(() => {
        vi.useRealTimers();
    });

    it('returns true while loading', () => {
        const { result } = renderHook(() => useMinimumLoading(true, 1000));
        expect(result.current).toBe(true);
    });

    it('stays true until minimum time elapses after loading finishes', () => {
        let isLoading = true;
        const { result, rerender } = renderHook(() => useMinimumLoading(isLoading, 1000));

        act(() => {
            vi.advanceTimersByTime(200);
        });
        isLoading = false;
        rerender();

        expect(result.current).toBe(true);

        act(() => {
            vi.advanceTimersByTime(799);
        });
        expect(result.current).toBe(true);

        act(() => {
            vi.advanceTimersByTime(1);
        });
        expect(result.current).toBe(false);
    });

    it('returns false immediately when loading finishes after minimum time has elapsed', () => {
        let isLoading = true;
        const { result, rerender } = renderHook(() => useMinimumLoading(isLoading, 500));

        act(() => {
            vi.advanceTimersByTime(600);
        });
        isLoading = false;
        rerender();

        expect(result.current).toBe(false);
    });

    it('returns false when not loading and minimum time has not started', () => {
        const { result } = renderHook(() => useMinimumLoading(false, 1000));
        expect(result.current).toBe(false);
    });
});
