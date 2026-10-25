import { userEvent } from '@testing-library/user-event';
import { afterEach, describe, expect, it } from 'vitest';
import { cleanup, screen, within } from '@testing-library/react';
import { loadDevMessages, loadErrorMessages } from '@apollo/client/dev';

import { mockUpdateRecipeAddYield } from '@recipe/graphql/mutations/__mocks__/recipe';
import { mockUpdateRecipeRemoveYield } from '@recipe/graphql/mutations/__mocks__/recipe';
import { clickFindByText, enterEditRecipePage, enterViewRecipePage } from '@recipe/utils/tests';

import { renderComponent } from './utils';

loadErrorMessages();
loadDevMessages();

type User = ReturnType<typeof userEvent.setup>;

async function focusYield(user: User) {
    if (document.activeElement !== screen.getByLabelText('Input yield')) {
        await user.click(screen.getByLabelText('Enter yield'));
    }
}

async function addRow(user: User, quantity: string, choice: string) {
    await focusYield(user);
    await user.keyboard(`${quantity} `);
    await clickFindByText(screen, user, choice);
}

async function yieldTooltip(user: User): Promise<string[]> {
    const info = screen.getByLabelText('Show recipe yield');
    await user.unhover(info);
    await user.hover(info);
    const tooltip = await screen.findByLabelText('Recipe yield');
    return within(tooltip)
        .getAllByRole('listitem')
        .map((item) => item.textContent ?? '');
}

async function addYield(user: User) {
    await enterEditRecipePage(screen, user, 'Mock Recipe', 'Instruction one.');
    await addRow(user, '2', 'skip unit');
    await addRow(user, '900', 'grams');
    await user.click(screen.getByLabelText('Save recipe'));
}

describe('Recipe yield', () => {
    afterEach(() => {
        cleanup();
    });

    it('should not show the yield icon when the recipe has no yield', async () => {
        renderComponent();
        const user = userEvent.setup();

        await enterViewRecipePage(screen, user, 'Mock Recipe', 'Instruction one.');

        expect(screen.queryByLabelText('Show recipe yield')).toBeNull();
    });

    it('should add a yield in two dimensions, and show it on the recipe', async () => {
        renderComponent([mockUpdateRecipeAddYield]);
        const user = userEvent.setup();

        await addYield(user);

        // The servings info icon's tooltip lists each row; a count of whole recipes reads with
        // the recipe's title.
        await enterViewRecipePage(screen, user, 'Mock Recipe', 'Instruction one.');
        expect(await yieldTooltip(user)).toEqual(['2 mock recipe', '900g']);
    });

    it('should scale the yield with the servings', async () => {
        renderComponent([mockUpdateRecipeAddYield]);
        const user = userEvent.setup();

        await addYield(user);
        await enterViewRecipePage(screen, user, 'Mock Recipe', 'Instruction one.');
        // 4 servings → 5
        await user.click(screen.getByLabelText('Increase serving size'));

        expect(await yieldTooltip(user)).toEqual(['2½ mock recipe', '1125g']);
    });

    it('should add a row once it has a quantity and a unit', async () => {
        renderComponent();
        const user = userEvent.setup();

        await enterEditRecipePage(screen, user, 'Mock Recipe', 'Instruction one.');
        await addRow(user, '900', 'grams');

        expect(screen.getByLabelText('900g')).not.toBeNull();
        // The input stays open for the next row, as it does for ingredients.
        expect(screen.getByLabelText('Enter yield').textContent).toBe('Enter quantity');
    });

    it('should add a row from a typed unit name', async () => {
        renderComponent();
        const user = userEvent.setup();

        await enterEditRecipePage(screen, user, 'Mock Recipe', 'Instruction one.');
        await focusYield(user);
        await user.keyboard('900 g ');

        expect(screen.getByLabelText('900g')).not.toBeNull();
    });

    it('should refuse a quantity that starts with a letter', async () => {
        renderComponent();
        const user = userEvent.setup();

        await enterEditRecipePage(screen, user, 'Mock Recipe', 'Instruction one.');
        await focusYield(user);
        await user.keyboard('g');

        // An ingredient may skip its quantity ("salt"); a yield row may not.
        expect(
            await screen.findByText(
                'Only numbers and fractions are allowed when inputting a quantity.'
            )
        ).not.toBeNull();
    });

    it('should not offer a unit in a dimension another row already has', async () => {
        renderComponent();
        const user = userEvent.setup();

        await enterEditRecipePage(screen, user, 'Mock Recipe', 'Instruction one.');
        await addRow(user, '900', 'grams');
        await focusYield(user);
        await user.keyboard('2 ');

        expect(await screen.findByText('cups')).not.toBeNull();
        expect(screen.queryByText('kilograms')).toBeNull();
        expect(screen.queryByText('grams')).toBeNull();
    });

    it('should not add a typed unit in a dimension another row already has', async () => {
        renderComponent();
        const user = userEvent.setup();

        await enterEditRecipePage(screen, user, 'Mock Recipe', 'Instruction one.');
        await addRow(user, '900', 'grams');
        await focusYield(user);
        await user.keyboard('1 kg ');

        expect(screen.queryByLabelText('1kg')).toBeNull();
    });

    it('should not offer a count unit another row already has', async () => {
        renderComponent();
        const user = userEvent.setup();

        await enterEditRecipePage(screen, user, 'Mock Recipe', 'Instruction one.');
        await addRow(user, '2', 'skip unit');
        await focusYield(user);
        await user.keyboard('2 ');

        // A count row rules out only its own unit, not the whole dimension.
        expect(await screen.findByText('grams')).not.toBeNull();
        expect(screen.queryByText('skip unit')).toBeNull();
    });

    it('should hide the input when every unit is ruled out', async () => {
        renderComponent();
        const user = userEvent.setup();

        await enterEditRecipePage(screen, user, 'Mock Recipe', 'Instruction one.');
        await addRow(user, '2', 'skip unit');
        await addRow(user, '900', 'grams');
        await addRow(user, '4', 'cups');

        expect(screen.queryByLabelText('Enter yield')).toBeNull();
    });

    it('should remove a saved yield', async () => {
        renderComponent([mockUpdateRecipeAddYield, mockUpdateRecipeRemoveYield]);
        const user = userEvent.setup();

        await addYield(user);
        await enterViewRecipePage(screen, user, 'Mock Recipe', 'Instruction one.');
        expect(await yieldTooltip(user)).toEqual(['2 mock recipe', '900g']);
        await user.click(screen.getByLabelText('Navigate to home page'));

        // The saved rows load into the editor; removing both clears the yield.
        await enterEditRecipePage(screen, user, 'Mock Recipe', 'Instruction one.');
        await user.click(screen.getByLabelText('Remove 900g'));
        await user.click(screen.getByLabelText('Remove 2 mock recipe'));
        await user.click(screen.getByLabelText('Save recipe'));

        await enterViewRecipePage(screen, user, 'Mock Recipe', 'Instruction one.');
        expect(screen.queryByLabelText('Show recipe yield')).toBeNull();
    });
});
