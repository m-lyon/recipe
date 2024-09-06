import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it } from 'vitest';
import { loadDevMessages, loadErrorMessages } from '@apollo/client/dev';
import { cleanup, getDefaultNormalizer, screen } from '@testing-library/react';

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
        const ingredientInput = screen.getByText('Enter ingredient');
        await user.click(ingredientInput);
        await user.keyboard('1');

        // Expect
        expect(screen.queryByText('1')).not.toBeNull();
    });
    it('should reset via escape key', async () => {
        const user = userEvent.setup();
        // Render
        renderComponent();

        // Act
        const ingredientInput = screen.getByText('Enter ingredient');
        await user.click(ingredientInput);
        await user.keyboard('{1}{Escape}');

        // Expect
        expect(screen.queryByText('Enter ingredient')).not.toBeNull();
    });
    it('should switch to the unit state', async () => {
        const user = userEvent.setup();
        // Render
        renderComponent();

        // Act
        const ingredientInput = screen.getByText('Enter ingredient');
        await user.click(ingredientInput);
        await user.keyboard('{2}{.}{5}{ }');

        // Expect
        expect(
            screen.queryByText('2.5 ', { normalizer: getDefaultNormalizer({ trim: false }) })
        ).not.toBeNull();
        expect(screen.queryByText('skip unit')).not.toBeNull();
    });
    it('should display a fraction', async () => {
        const user = userEvent.setup();
        // Render
        renderComponent();

        // Act
        const quantityInput = screen.getByText('Enter ingredient');
        await user.click(quantityInput);
        await user.keyboard('{1}{{/}}{2}{ }');

        // Expect
        expect(
            screen.queryByText('½ ', { normalizer: getDefaultNormalizer({ trim: false }) })
        ).not.toBeNull();
    });
    it('should allow a number range', async () => {
        const user = userEvent.setup();
        // Render
        renderComponent();

        // Act
        const quantityInput = screen.getByText('Enter ingredient');
        await user.click(quantityInput);
        await user.keyboard('{1}{.}{5}{{-}}{2}{.}{5}{ }');

        // Expect
        expect(
            screen.queryByText('1.5-2.5 ', { normalizer: getDefaultNormalizer({ trim: false }) })
        ).not.toBeNull();
    });
    it('should reset the fraction display', async () => {
        const user = userEvent.setup();
        // Render
        renderComponent();

        // Act
        const quantityInput = screen.getByText('Enter ingredient');
        await user.click(quantityInput);
        await user.keyboard('{1}{{/}}{2}{ }{Backspace}');

        // Expect
        expect(
            screen.queryByText('1/2', { normalizer: getDefaultNormalizer({ trim: false }) })
        ).not.toBeNull();
    });
    it('should display an error message for alphabetic character', async () => {
        const user = userEvent.setup();
        // Render
        renderComponent();

        // Act
        const quantityInput = screen.getByText('Enter ingredient');
        await user.click(quantityInput);
        await user.keyboard('{1}{a}');

        // Expect
        expect(screen.queryByText('Invalid input')).not.toBeNull();
    });
    it('should display an error message for non alphanumeric character at start', async () => {
        const user = userEvent.setup();
        // Render
        renderComponent();

        // Act
        const quantityInput = screen.getByText('Enter ingredient');
        await user.click(quantityInput);
        await user.keyboard('{-}');

        // Expect
        expect(screen.queryByText('Invalid input')).not.toBeNull();
    });
    it('should skip the quantity', async () => {
        const user = userEvent.setup();
        // Render
        renderComponent();

        // Act
        const quantityInput = screen.getByText('Enter ingredient');
        await user.click(quantityInput);
        await user.click(screen.getByText('skip quantity'));

        // Expect
        expect(screen.queryByText('chicken')).not.toBeNull();
        expect(screen.queryByText('apple')).not.toBeNull();
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
        const ingredientInput = screen.getByText('Enter ingredient');
        await user.click(ingredientInput);
        await user.keyboard('{1}');
        await user.click(document.body);

        // Expect
        expect(screen.queryByText('Enter ingredient')).not.toBeNull();
    });
});
