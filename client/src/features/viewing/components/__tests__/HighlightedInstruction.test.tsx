import { userEvent } from '@testing-library/user-event';
import { afterEach, describe, expect, it } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';
import { MantineProvider } from '@mantine/core';

import { HighlightedInstruction } from '../HighlightedInstruction';

const renderComponent = (
    text: string,
    keyPhrases: Array<{ value: string; description: string }>,
    highlightStyle?: React.CSSProperties
) => {
    return render(
        <MantineProvider env='test'>
            <HighlightedInstruction
                text={text}
                keyPhrases={keyPhrases}
                highlightStyle={highlightStyle}
            />
        </MantineProvider>
    );
};

describe('HighlightedInstruction', () => {
    afterEach(() => {
        cleanup();
    });

    it('should render plain text when no key phrases match', () => {
        renderComponent('Mix the ingredients together.', [
            { value: 'sear', description: 'To cook at high heat.' },
        ]);

        expect(screen.getByText('Mix the ingredients together.')).not.toBeNull();
        expect(screen.queryByRole('button')).toBeNull();
    });

    it('should render plain text when key phrases array is empty', () => {
        renderComponent('Sear the steak.', []);

        expect(screen.getByText('Sear the steak.')).not.toBeNull();
    });

    it('should render matching phrase as a highlighted span', () => {
        renderComponent('Sear the steak until golden.', [
            { value: 'sear', description: 'To cook at high heat.' },
        ]);

        const highlighted = screen.getByText('Sear');
        expect(highlighted.tagName).toBe('SPAN');
        expect(highlighted.style.fontWeight).toBe('bold');
        expect(highlighted.style.color).toBe('teal');
        expect(highlighted.style.cursor).toBe('pointer');
        // The remainder is a text node — verify via full text content
        expect(screen.getByText(/the steak until golden/)).not.toBeNull();
    });

    it('should open popover with value and description on click', async () => {
        const user = userEvent.setup();
        renderComponent('Sear the steak.', [
            { value: 'sear', description: 'To cook at high heat until a crust forms.' },
        ]);

        await user.click(screen.getByText('Sear'));

        expect(await screen.findByText('sear')).not.toBeNull();
        expect(
            await screen.findByText('To cook at high heat until a crust forms.')
        ).not.toBeNull();
    });

    it('should apply custom highlightStyle when provided', () => {
        const customStyle = { fontWeight: 'normal' as const, color: 'red', cursor: 'default' };
        renderComponent('Blanch the vegetables.', [
            { value: 'blanch', description: 'Briefly boil then plunge into ice water.' },
        ], customStyle);

        const highlighted = screen.getByText('Blanch');
        expect(highlighted.style.color).toBe('red');
        expect(highlighted.style.cursor).toBe('default');
    });

    it('should highlight multiple key phrases in the same instruction', () => {
        renderComponent('Sear the meat then blanch the vegetables.', [
            { value: 'sear', description: 'Cook at high heat.' },
            { value: 'blanch', description: 'Briefly boil.' },
        ]);

        const searSpan = screen.getByText('Sear');
        const blanchSpan = screen.getByText('blanch');
        expect(searSpan.tagName).toBe('SPAN');
        expect(blanchSpan.tagName).toBe('SPAN');
        // Verify the container has the full text including non-highlighted parts
        expect(screen.getByText(/the meat then/)).not.toBeNull();
        expect(screen.getByText(/the vegetables/)).not.toBeNull();
    });
});
