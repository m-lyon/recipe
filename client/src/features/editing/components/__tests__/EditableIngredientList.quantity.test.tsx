import { userEvent } from '@testing-library/user-event';
import { afterEach, describe, expect, it } from 'vitest';
import { cleanup, screen } from '@testing-library/react';
import { loadDevMessages, loadErrorMessages } from '@apollo/client/dev';

import { haveValueByLabelText, notNullByText, nullByText } from '@recipe/utils/tests';

import { renderComponent } from './utils';

loadErrorMessages();
loadDevMessages();

describe('EditableIngredient Quantity Keyboard', () => {
    afterEach(() => {
        cleanup();
    });

    it('should enter a quantity', async () => {
        const user = userEvent.setup();
        // Render
        renderComponent();

        // Act
        await user.click(screen.getByText('Enter ingredient'));
        await user.keyboard('1');

        // Expect
        expect(screen.queryByText('1')).not.toBeNull();
    });
    it('should reset via escape key', async () => {
        const user = userEvent.setup();
        // Render
        renderComponent();

        // Act
        await user.click(screen.getByText('Enter ingredient'));
        await user.keyboard('{1}{Escape}');

        // Expect
        expect(screen.queryByText('Enter ingredient')).not.toBeNull();
        nullByText(screen, 'Invalid character.');
    });
    it('should switch to the unit state', async () => {
        const user = userEvent.setup();
        // Render
        renderComponent();

        // Act
        await user.click(screen.getByText('Enter ingredient'));
        await user.keyboard('{2}{.}{5}{ }');

        // Expect
        haveValueByLabelText(screen, 'Input ingredient #1 for subsection 1', '2.5 ');
        expect(screen.queryByText('skip unit')).not.toBeNull();
    });
    it('should switch to unit state when enter is pressed after valid quantity', async () => {
        const user = userEvent.setup();
        // Render
        renderComponent();

        // Act
        await user.click(screen.getByText('Enter ingredient'));
        await user.keyboard('{1}{Enter}');

        // Expect
        expect(screen.queryByText('skip unit')).not.toBeNull();
    });
    it('should display a fraction', async () => {
        const user = userEvent.setup();
        // Render
        renderComponent();

        // Act
        await user.click(screen.getByText('Enter ingredient'));
        await user.keyboard('{1}{{/}}{2}{ }');

        // Expect
        haveValueByLabelText(screen, 'Input ingredient #1 for subsection 1', '½ ');
    });
    it('should allow a number range', async () => {
        const user = userEvent.setup();
        // Render
        renderComponent();

        // Act
        await user.click(screen.getByText('Enter ingredient'));
        await user.keyboard('{1}{.}{5}{{-}}{2}{.}{5}{ }');

        // Expect
        haveValueByLabelText(screen, 'Input ingredient #1 for subsection 1', '1.5-2.5 ');
    });
    it('should reset the fraction display', async () => {
        const user = userEvent.setup();
        // Render
        renderComponent();

        // Act
        await user.click(screen.getByText('Enter ingredient'));
        await user.keyboard('{1}{{/}}{2}{ }{Backspace}');

        // Expect
        haveValueByLabelText(screen, 'Input ingredient #1 for subsection 1', '1/2');
    });
    it('should display an error message for alphabetic character', async () => {
        const user = userEvent.setup();
        // Render
        renderComponent();

        // Act
        await user.click(screen.getByText('Enter ingredient'));
        await user.keyboard('{1}{a}');

        // Expect
        expect(screen.queryByText('Invalid input')).not.toBeNull();
    });
    it('should display an error message for non alphanumeric character at start', async () => {
        const user = userEvent.setup();
        // Render
        renderComponent();

        // Act
        await user.click(screen.getByText('Enter ingredient'));
        await user.keyboard('{-}');

        // Expect
        expect(screen.queryByText('Invalid input')).not.toBeNull();
    });
    it('should skip the quantity using "skip quantity"', async () => {
        const user = userEvent.setup();
        // Render
        renderComponent();

        // Act
        await user.click(screen.getByText('Enter ingredient'));
        await user.keyboard('{Enter}');

        // Expect
        await notNullByText(screen, 'large', 'chicken');
    });
    it('should skip the quantity through typing letters', async () => {
        const user = userEvent.setup();
        // Render
        renderComponent();

        // Act
        await user.click(screen.getByText('Enter ingredient'));
        await user.keyboard('{a}');

        // Expect
        await notNullByText(screen, 'large', 'apple');
        haveValueByLabelText(screen, 'Input ingredient #1 for subsection 1', 'a');
        expect(screen.queryByText('cup')).toBeNull();
    });
    it('should display skip quantity when quantity is deleted', async () => {
        const user = userEvent.setup();
        // Render
        renderComponent();

        // Act
        await user.click(screen.getByText('Enter ingredient'));
        await user.keyboard('{1}{Backspace}');

        // Expect
        expect(screen.queryByText('skip quantity')).not.toBeNull();
    });
    it('should display skip quantity when quantity is deleted after state change', async () => {
        const user = userEvent.setup();
        // Render
        renderComponent();

        // Act
        await user.click(screen.getByText('Enter ingredient'));
        await user.keyboard('{1}{ }{Backspace>2/}');

        // Expect
        expect(screen.queryByText('skip quantity')).not.toBeNull();
    });
    it('should not display the dropdown suggestion list when quantity is not null', async () => {
        const user = userEvent.setup();
        // Render
        renderComponent();

        // Act
        await user.click(screen.getByText('Enter ingredient'));
        await user.keyboard('{1}{ }{Backspace}');

        // Expect
        expect(screen.queryByLabelText('Dropdown suggestion list')).toBeNull();
    });
    it('should display one debounced toast message for multiple invalid inputs', async () => {
        const user = userEvent.setup();
        // Render
        renderComponent();

        // Act
        await user.click(screen.getByText('Enter ingredient'));
        await user.keyboard('{1}{a}{c}');

        // Expect
        expect(screen.queryAllByText('Invalid input').length).toBe(1);
    });
});
describe('EditableIngredient Quantity Click', () => {
    afterEach(() => {
        cleanup();
    });
    it('should reset via click away from element', async () => {
        const user = userEvent.setup();
        // Render
        renderComponent();

        // Act
        await user.click(screen.getByText('Enter ingredient'));
        await user.keyboard('{1}');
        await user.click(document.body);

        // Expect
        expect(screen.queryByText('Enter ingredient')).not.toBeNull();
    });
    it('should skip the quantity', async () => {
        const user = userEvent.setup();
        // Render
        renderComponent();

        // Act
        await user.click(screen.getByText('Enter ingredient'));
        await user.click(screen.getByText('skip quantity'));

        // Expect
        await notNullByText(screen, 'large', 'chicken');
    });
});
