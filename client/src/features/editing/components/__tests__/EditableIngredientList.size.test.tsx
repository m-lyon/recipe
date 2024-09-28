import { userEvent } from '@testing-library/user-event';
import { afterEach, describe, expect, it } from 'vitest';
import { cleanup, screen } from '@testing-library/react';
import { loadDevMessages, loadErrorMessages } from '@apollo/client/dev';

import { haveValueByLabelText, notNullByText, nullByText } from '@recipe/utils/tests';

import { renderComponent } from './utils';

loadErrorMessages();
loadDevMessages();

describe('EditableIngredient Size Keyboard', () => {
    afterEach(() => {
        cleanup();
    });
    it('should reset via escape key', async () => {
        const user = userEvent.setup();
        // Render
        renderComponent();

        // Act
        const ingredientInput = screen.getByText('Enter ingredient');
        await user.click(ingredientInput);
        await user.keyboard('{1}{ }{ArrowDown}{Enter}');
        haveValueByLabelText(screen, 'Input ingredient #1 for subsection 1', '1 cup ');
        await user.keyboard('{Escape}');

        // Expect
        haveValueByLabelText(screen, 'Input ingredient #1 for subsection 1', '');
        expect(screen.queryByText('Enter ingredient')).not.toBeNull();
    });
    it('should switch to the ingredient state singular', async () => {
        const user = userEvent.setup();
        // Render
        renderComponent();

        // Act
        const ingredientInput = screen.getByText('Enter ingredient');
        await user.click(ingredientInput);
        await user.keyboard('{1}{ }{ArrowDown}{Enter}{ArrowDown}{Enter}');

        // Expect
        haveValueByLabelText(screen, 'Input ingredient #1 for subsection 1', '1 cup large ');
        expect(screen.queryByText('chicken')).not.toBeNull();
        nullByText(screen, 'cup', 'small');
    });
    it('should switch to the ingredient state plural', async () => {
        const user = userEvent.setup();
        // Render
        renderComponent();

        // Act
        const ingredientInput = screen.getByText('Enter ingredient');
        await user.click(ingredientInput);
        await user.keyboard('{2}{ }{ArrowDown}{Enter}{ArrowDown}{Enter}');

        // Expect
        haveValueByLabelText(screen, 'Input ingredient #1 for subsection 1', '2 cups large ');
        expect(screen.queryByText('chicken')).not.toBeNull();
        nullByText(screen, 'cups', 'small');
    });
    it('should display skip size', async () => {
        const user = userEvent.setup();
        // Render
        renderComponent();

        // Act
        const quantityInput = screen.getByText('Enter ingredient');
        await user.click(quantityInput);
        await user.keyboard('{1}{ }{Enter}');

        // Expect
        expect(screen.queryByText('skip size')).not.toBeNull();
    });
    it('should display all size options', async () => {
        const user = userEvent.setup();
        // Render
        renderComponent();

        // Act
        const ingredientInput = screen.getByText('Enter ingredient');
        await user.click(ingredientInput);
        await user.keyboard('{1}{ }{Enter}');

        // Expect
        expect(screen.queryByText('Enter ingredient')).toBeNull();
        haveValueByLabelText(screen, 'Input ingredient #1 for subsection 1', '1 ');
        await notNullByText(screen, 'small', 'medium', 'large');
    });
    it('should display add new size', async () => {
        const user = userEvent.setup();
        // Render
        renderComponent();

        // Act
        await user.click(screen.getByText('Enter ingredient'));
        await user.keyboard('{1}{ }{c}{u}{p}{ }{c}');
        haveValueByLabelText(screen, 'Input ingredient #1 for subsection 1', '1 cup c');

        // Expect
        expect(screen.queryByText('add new size')).not.toBeNull();
    });
    it('should display an error for a numeric character', async () => {
        const user = userEvent.setup();
        // Render
        renderComponent();

        // Act
        const ingredientInput = screen.getByText('Enter ingredient');
        await user.click(ingredientInput);
        await user.keyboard('{1}{ }{Enter}{1}');

        // Expect
        expect(screen.queryByText('Invalid input')).not.toBeNull();
    });
    it('should skip size', async () => {
        const user = userEvent.setup();
        // Render
        renderComponent();

        // Act
        const quantityInput = screen.getByText('Enter ingredient');
        await user.click(quantityInput);
        await user.keyboard('{1}{ }{Enter}{Enter}');

        // Expect
        haveValueByLabelText(screen, 'Input ingredient #1 for subsection 1', '1 ');
        expect(screen.queryByText('chicken')).not.toBeNull();
        nullByText(screen, 'cup', 'small');
    });
    it('should open up the new size popover', async () => {
        const user = userEvent.setup();
        // Render
        renderComponent();

        // Act
        const quantityInput = screen.getByText('Enter ingredient');
        await user.click(quantityInput);
        await user.keyboard('{1}{ }{Enter}{c}{u}{t}{z}{Enter}');

        // Expect
        await notNullByText(screen, 'Add new size', 'Save');
    });

    it('should reset back to the quantity state', async () => {
        const user = userEvent.setup();
        // Render
        renderComponent();

        // Act
        const quantityInput = screen.getByText('Enter ingredient');
        await user.click(quantityInput);
        await user.keyboard('{1}{ }{g}{ }{s}{m}{a}{Enter}{Backspace>9/}');

        // Expect
        nullByText(screen, 'chicken', 'cup', 'small');
        haveValueByLabelText(screen, 'Input ingredient #1 for subsection 1', '1');
    });
});
describe('EditableIngredient Size Click', () => {
    afterEach(() => {
        cleanup();
    });
    it('should switch to the ingredient state singular', async () => {
        const user = userEvent.setup();
        // Render
        renderComponent();

        // Act
        const ingredientInput = screen.getByText('Enter ingredient');
        await user.click(ingredientInput);
        await user.keyboard('{1}{ }');
        await user.click(screen.getByText('cup'));
        await user.click(screen.getByText('small'));

        // Expect
        haveValueByLabelText(screen, 'Input ingredient #1 for subsection 1', '1 cup small ');
        expect(screen.queryByText('chicken')).not.toBeNull();
        nullByText(screen, 'cup', 'large');
    });
    it('should switch to the ingredient state plural', async () => {
        const user = userEvent.setup();
        // Render
        renderComponent();

        // Act
        const ingredientInput = screen.getByText('Enter ingredient');
        await user.click(ingredientInput);
        await user.keyboard('{2}{ }');
        await user.click(screen.getByText('cups'));
        await user.click(screen.getByText('small'));

        // Expect
        haveValueByLabelText(screen, 'Input ingredient #1 for subsection 1', '2 cups small ');
        expect(screen.queryByText('chicken')).not.toBeNull();
        nullByText(screen, 'cups', 'large');
    });
    it('should reset via click away', async () => {
        const user = userEvent.setup();
        // Render
        renderComponent();

        // Act
        const ingredientInput = screen.getByText('Enter ingredient');
        await user.click(ingredientInput);
        await user.keyboard('{1}{ }{ArrowDown}{Enter}');
        haveValueByLabelText(screen, 'Input ingredient #1 for subsection 1', '1 cup ');
        await user.click(document.body);

        // Expect
        haveValueByLabelText(screen, 'Input ingredient #1 for subsection 1', '');
        expect(screen.queryByText('Enter ingredient')).not.toBeNull();
    });
    it('should skip size', async () => {
        const user = userEvent.setup();
        // Render
        renderComponent();

        // Act
        const quantityInput = screen.getByText('Enter ingredient');
        await user.click(quantityInput);
        await user.keyboard('{1}{ }');
        await user.click(screen.getByText('skip unit'));
        await user.click(screen.getByText('skip size'));

        // Expect
        haveValueByLabelText(screen, 'Input ingredient #1 for subsection 1', '1 ');
        expect(screen.queryByText('chicken')).not.toBeNull();
        nullByText(screen, 'cup', 'small');
    });
    it('should open up the new size popover', async () => {
        const user = userEvent.setup();
        // Render
        renderComponent();

        // Act
        const quantityInput = screen.getByText('Enter ingredient');
        await user.click(quantityInput);
        await user.keyboard('{1}{ }');
        await user.click(screen.getByText('cup'));
        await user.keyboard('{c}');
        haveValueByLabelText(screen, 'Input ingredient #1 for subsection 1', '1 cup c');
        await user.click(screen.getByText('add new size'));

        // Expect
        await notNullByText(screen, 'Add new size', 'Save');
    });
});
