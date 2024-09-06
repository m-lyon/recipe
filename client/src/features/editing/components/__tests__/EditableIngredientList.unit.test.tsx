import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it } from 'vitest';
import { loadDevMessages, loadErrorMessages } from '@apollo/client/dev';
import { cleanup, getDefaultNormalizer, screen } from '@testing-library/react';

import { notNullByText, nullByText } from '@recipe/utils/tests';

import { renderComponent } from './utils';

loadErrorMessages();
loadDevMessages();

describe('EditableIngredient Unit Keyboard', () => {
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
        await user.keyboard('{1}{ }{Escape}');

        // Expect
        expect(screen.queryByText('1 ')).toBeNull();
        expect(screen.queryByText('Enter ingredient')).not.toBeNull();
    });
    it('should switch to the ingredient state singular', async () => {
        const user = userEvent.setup();
        // Render
        renderComponent();

        // Act
        const ingredientInput = screen.getByText('Enter ingredient');
        await user.click(ingredientInput);
        await user.keyboard('{1}{ }{ArrowDown}{Enter}');

        // Expect
        expect(
            screen.queryByText('1 cup ', { normalizer: getDefaultNormalizer({ trim: false }) })
        ).not.toBeNull();
        expect(
            screen.queryByText('1 cup  ', { normalizer: getDefaultNormalizer({ trim: false }) })
        ).toBeNull();
        expect(screen.queryByText('chicken')).not.toBeNull();
    });
    it('should switch to the ingredient state plural', async () => {
        const user = userEvent.setup();
        // Render
        renderComponent();

        // Act
        const ingredientInput = screen.getByText('Enter ingredient');
        await user.click(ingredientInput);
        await user.keyboard('{2}{ }{ArrowDown}{Enter}');

        // Expect
        expect(
            screen.queryByText('2 cups ', { normalizer: getDefaultNormalizer({ trim: false }) })
        ).not.toBeNull();
        expect(screen.queryByText('chicken')).not.toBeNull();
    });
    it('should display skip unit', async () => {
        const user = userEvent.setup();
        // Render
        renderComponent();

        // Act
        const quantityInput = screen.getByText('Enter ingredient');
        await user.click(quantityInput);
        await user.keyboard('{1}{ }');

        // Expect
        expect(screen.queryByText('skip unit')).not.toBeNull();
    });
    it('should display all unit options', async () => {
        const user = userEvent.setup();
        // Render
        renderComponent();

        // Act
        const ingredientInput = screen.getByText('Enter ingredient');
        await user.click(ingredientInput);
        await user.keyboard('{1}{ }');

        // Expect
        expect(screen.queryByText('Enter ingredient')).toBeNull();
        expect(
            screen.queryByText('1 ', { normalizer: getDefaultNormalizer({ trim: false }) })
        ).not.toBeNull();
        await notNullByText(screen, 'teaspoon', 'gram', 'ounce', 'cup');
    });
    it('should display add new unit', async () => {
        const user = userEvent.setup();
        // Render
        renderComponent();

        // Act
        const ingredientInput = screen.getByText('Enter ingredient');
        await user.click(ingredientInput);
        await user.keyboard('{1}{ }{c}{u}{t}{z}');

        // Expect
        expect(screen.queryByText('Add new unit')).not.toBeNull();
    });
    it('should display an error for a numeric character', async () => {
        const user = userEvent.setup();
        // Render
        renderComponent();

        // Act
        const ingredientInput = screen.getByText('Enter ingredient');
        await user.click(ingredientInput);
        await user.keyboard('{1}{ }{1}');

        // Expect
        expect(screen.queryByText('Invalid input')).not.toBeNull();
    });
    it('should skip unit', async () => {
        const user = userEvent.setup();
        // Render
        renderComponent();

        // Act
        const quantityInput = screen.getByText('Enter ingredient');
        await user.click(quantityInput);
        await user.keyboard('{1}{ }');
        await user.click(screen.getByText('skip unit'));

        // Expect
        expect(
            screen.queryByText('1 ', { normalizer: getDefaultNormalizer({ trim: false }) })
        ).not.toBeNull();
        expect(screen.queryByText('chicken')).not.toBeNull();
    });
    it('should open up the new unit popover', async () => {
        const user = userEvent.setup();
        // Render
        renderComponent();

        // Act
        const quantityInput = screen.getByText('Enter ingredient');
        await user.click(quantityInput);
        await user.keyboard('{1}{ }{c}{u}{t}{z}{Enter}');

        // Expect
        await notNullByText(screen, 'Add new unit', 'Save');
    });

    it('should reset back to the quantity state', async () => {
        const user = userEvent.setup();
        // Render
        renderComponent();

        // Act
        const quantityInput = screen.getByText('Enter ingredient');
        await user.click(quantityInput);
        await user.keyboard('{1}{ }{g}{ }{Backspace>2/}');

        // Expect
        nullByText(screen, 'chicken', '1 g');
    });
});
describe('EditableIngredient Unit Spacebar', () => {
    afterEach(() => {
        cleanup();
    });
    it('should switch to the ingredient state singular', async () => {
        const user = userEvent.setup();
        // Render
        renderComponent();

        // Act
        const quantityInput = screen.getByText('Enter ingredient');
        await user.click(quantityInput);
        await user.keyboard('{1}{ }{c}{u}{p}{ }');

        // Expect
        expect(
            screen.queryByText('1 cup ', { normalizer: getDefaultNormalizer({ trim: false }) })
        ).not.toBeNull();
        expect(
            screen.queryByText('1 cup  ', {
                normalizer: getDefaultNormalizer({ trim: false, collapseWhitespace: false }),
            })
        ).toBeNull();
        expect(screen.queryByText('chicken')).not.toBeNull();
    });
    it('should switch to the ingredient state plural', async () => {
        const user = userEvent.setup();
        // Render
        renderComponent();

        // Act
        const quantityInput = screen.getByText('Enter ingredient');
        await user.click(quantityInput);
        await user.keyboard('{2}{ }{c}{u}{p}{s}{ }');

        // Expect
        expect(
            screen.queryByText('2 cups ', { normalizer: getDefaultNormalizer({ trim: false }) })
        ).not.toBeNull();
        expect(screen.queryByText('chicken')).not.toBeNull();
    });
});
describe('EditableIngredient Unit Click', () => {
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

        // Expect
        expect(
            screen.queryByText('1 cup ', { normalizer: getDefaultNormalizer({ trim: false }) })
        ).not.toBeNull();
        expect(screen.queryByText('chicken')).not.toBeNull();
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

        // Expect
        expect(
            screen.queryByText('2 cups ', { normalizer: getDefaultNormalizer({ trim: false }) })
        ).not.toBeNull();
        expect(screen.queryByText('chicken')).not.toBeNull();
    });
    it('should reset via click away', async () => {
        const user = userEvent.setup();
        // Render
        renderComponent();

        // Act
        const quantityInput = screen.getByText('Enter ingredient');
        await user.click(quantityInput);
        await user.keyboard('{1}{ }{c}');
        await user.click(document.body);

        // Expect
        expect(screen.queryByText('Enter ingredient')).not.toBeNull();
    });
    it('should skip unit', async () => {
        const user = userEvent.setup();
        // Render
        renderComponent();

        // Act
        const quantityInput = screen.getByText('Enter ingredient');
        await user.click(quantityInput);
        await user.keyboard('{1}{ }');
        await user.click(screen.getByText('skip unit'));

        // Expect
        expect(
            screen.queryByText('1 ', { normalizer: getDefaultNormalizer({ trim: false }) })
        ).not.toBeNull();
        expect(screen.queryByText('chicken')).not.toBeNull();
    });
    it('should open up the new unit popover', async () => {
        const user = userEvent.setup();
        // Render
        renderComponent();

        // Act
        const quantityInput = screen.getByText('Enter ingredient');
        await user.click(quantityInput);
        await user.keyboard('{1}{ }{c}{u}{t}{z}');
        await user.click(screen.getByText('add new unit'));

        // Expect
        await notNullByText(screen, 'Add new unit', 'Save');
    });
});
