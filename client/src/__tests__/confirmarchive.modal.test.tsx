import { MantineProvider } from '@mantine/core';
import { userEvent } from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';

import { theme } from '@recipe/theme';
import { ConfirmArchiveModal } from '@recipe/features/editing';

vi.mock('@apollo/client', async (importOriginal) => {
    const actual = await importOriginal<typeof import('@apollo/client')>();

    return {
        ...actual,
        useMutation: vi.fn(() => [vi.fn()]),
    };
});

afterEach(() => {
    cleanup();
});

describe('ConfirmArchiveModal', () => {
    it('should call the supplied confirm handler', async () => {
        const user = userEvent.setup();
        const handleConfirm = vi.fn();

        render(
            <MantineProvider theme={theme} env='test'>
                <ConfirmArchiveModal show setShow={vi.fn()} onConfirm={handleConfirm} />
            </MantineProvider>
        );

        await user.click(screen.getByLabelText('Confirm archive action'));

        expect(handleConfirm).toHaveBeenCalledTimes(1);
    });
});
