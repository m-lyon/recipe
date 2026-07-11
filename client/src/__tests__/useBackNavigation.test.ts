import { useNavigate } from 'react-router-dom';
import { renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { PATH } from '@recipe/constants';
import { useBackNavigation } from '@recipe/common/hooks';

vi.mock('react-router-dom', async (importOriginal) => {
    const actual = await importOriginal<typeof import('react-router-dom')>();
    return { ...actual, useNavigate: vi.fn() };
});

function setHistoryIdx(idx: number) {
    Object.defineProperty(window.history, 'state', {
        value: { idx },
        configurable: true,
        writable: true,
    });
}

describe('useBackNavigation', () => {
    const navigate = vi.fn();

    beforeEach(() => {
        vi.clearAllMocks();
        vi.mocked(useNavigate).mockReturnValue(navigate);
    });

    it('navigates back when in-app history exists', () => {
        setHistoryIdx(2);
        const { result } = renderHook(() => useBackNavigation());
        result.current();
        expect(navigate).toHaveBeenCalledWith(-1);
    });

    it('falls back to home on a cold deep-link with no history', () => {
        setHistoryIdx(0);
        const { result } = renderHook(() => useBackNavigation());
        result.current();
        expect(navigate).toHaveBeenCalledWith(PATH.ROOT);
    });
});
