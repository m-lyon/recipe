import { userEvent } from '@testing-library/user-event';
import { afterEach, describe, expect, it } from 'vitest';
import { cleanup, screen } from '@testing-library/react';
import { loadDevMessages, loadErrorMessages } from '@apollo/client/dev';

import { haveValueByLabelText } from '@recipe/utils/tests';

import { renderComponent } from './utils';

loadErrorMessages();
loadDevMessages();

describe('Dropdown Action Keyboard', () => {
    afterEach(() => {
        cleanup();
    });
    it('should not navigate below dropdown options', async () => {
        const user = userEvent.setup();
        // Render
        renderComponent();

        // Act
        const ingredientInput = screen.getByText('Enter ingredient');
        await user.click(ingredientInput);
        await user.keyboard('{1}{ }{Enter>2/}{ArrowDown>10/}{Enter}');

        // Expect
        // last option is 'add new ingredient'
        expect(screen.queryByText('Add new ingredient')).not.toBeNull();
        expect(screen.queryByText('Save')).not.toBeNull();
    });
    it('should not navigate above dropdown options', async () => {
        const user = userEvent.setup();
        // Render
        renderComponent();

        // Act
        const ingredientInput = screen.getByText('Enter ingredient');
        await user.click(ingredientInput);
        await user.keyboard('{1}{ }{Enter>2/}{ArrowUp>4/}{Enter}');

        // Expect
        haveValueByLabelText(screen, 'Input ingredient #1 for subsection 1', '1 apple, ');
    });
});
