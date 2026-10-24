import { userEvent } from '@testing-library/user-event';
import { afterEach, describe, expect, it } from 'vitest';
import { cleanup, screen } from '@testing-library/react';
import { loadDevMessages, loadErrorMessages } from '@apollo/client/dev';

import { enterEditRecipePage, enterViewRecipePage } from '@recipe/utils/tests';
import { mockUpdateRecipeAddYield } from '@recipe/graphql/mutations/__mocks__/recipe';
import { mockUpdateRecipeRemoveYield } from '@recipe/graphql/mutations/__mocks__/recipe';

import { renderComponent } from './utils';

loadErrorMessages();
loadDevMessages();

type User = ReturnType<typeof userEvent.setup>;

/** Fills yield row `row` (1-based) with a quantity and a unit picked from its dropdown. */
async function fillRow(user: User, row: number, quantity: string, unitLabel: string) {
    await user.click(screen.getByRole('button', { name: 'Add measure' }));
    await user.type(screen.getByLabelText(`Yield quantity ${row}`), quantity);
    await user.click(screen.getAllByLabelText(`Yield unit ${row}`)[0]);
    await user.click(await screen.findByRole('option', { name: unitLabel }));
}

/** Adds "2 each" and "900 g" to Recipe One, and saves. */
async function addYield(user: User) {
    await enterEditRecipePage(screen, user, 'Mock Recipe', 'Instruction one.');
    await fillRow(user, 1, '2', 'each (whole batches)');
    await fillRow(user, 2, '900', 'g (gram)');
    await user.click(screen.getByLabelText('Save recipe'));
}

describe('Recipe yield', () => {
    afterEach(() => {
        cleanup();
    });

    it('should not show a yield when the recipe has none', async () => {
        renderComponent();
        const user = userEvent.setup();

        await enterViewRecipePage(screen, user, 'Mock Recipe', 'Instruction one.');

        expect(screen.queryByLabelText('Recipe yield')).toBeNull();
    });

    it('should add a yield in two dimensions, and show it on the recipe', async () => {
        renderComponent([mockUpdateRecipeAddYield]);
        const user = userEvent.setup();

        await addYield(user);

        // A count of whole batches reads with the recipe's title.
        await enterViewRecipePage(screen, user, 'Mock Recipe', 'Instruction one.');
        expect((await screen.findByLabelText('Recipe yield')).textContent).toBe(
            'Makes 2 mock recipe (≈ 900g)'
        );
    });

    it('should scale the yield with the servings', async () => {
        renderComponent([mockUpdateRecipeAddYield]);
        const user = userEvent.setup();

        await addYield(user);
        await enterViewRecipePage(screen, user, 'Mock Recipe', 'Instruction one.');
        await screen.findByLabelText('Recipe yield');
        // 4 servings → 5
        await user.click(screen.getByLabelText('Increase serving size'));

        expect(screen.getByLabelText('Recipe yield').textContent).toBe(
            'Makes 2½ mock recipe (≈ 1125g)'
        );
    });

    it('should not offer a unit in a dimension another row already has', async () => {
        renderComponent();
        const user = userEvent.setup();

        await enterEditRecipePage(screen, user, 'Mock Recipe', 'Instruction one.');
        await fillRow(user, 1, '900', 'g (gram)');
        await user.click(screen.getByRole('button', { name: 'Add measure' }));
        await user.click(screen.getAllByLabelText('Yield unit 2')[0]);

        expect(await screen.findByRole('option', { name: 'cup (cup)' })).not.toBeNull();
        expect(screen.queryByRole('option', { name: 'kg (kilogram)' })).toBeNull();
        expect(screen.queryByRole('option', { name: 'g (gram)' })).toBeNull();
    });

    it('should not offer a count unit another row already has', async () => {
        renderComponent();
        const user = userEvent.setup();

        await enterEditRecipePage(screen, user, 'Mock Recipe', 'Instruction one.');
        await fillRow(user, 1, '2', 'each (whole batches)');
        await user.click(screen.getByRole('button', { name: 'Add measure' }));
        await user.click(screen.getAllByLabelText('Yield unit 2')[0]);

        // A count row rules out only its own unit, not the whole dimension.
        expect(await screen.findByRole('option', { name: 'g (gram)' })).not.toBeNull();
        expect(screen.queryByRole('option', { name: 'each (whole batches)' })).toBeNull();
    });

    it('should not add a row when every unit is ruled out', async () => {
        renderComponent();
        const user = userEvent.setup();

        await enterEditRecipePage(screen, user, 'Mock Recipe', 'Instruction one.');
        await fillRow(user, 1, '2', 'each (whole batches)');
        await fillRow(user, 2, '900', 'g (gram)');
        await fillRow(user, 3, '4', 'cup (cup)');

        expect(screen.queryByRole('button', { name: 'Add measure' })).toBeNull();
    });

    it('should refuse to save a row with a quantity and no unit', async () => {
        renderComponent();
        const user = userEvent.setup();

        await enterEditRecipePage(screen, user, 'Mock Recipe', 'Instruction one.');
        await user.click(screen.getByRole('button', { name: 'Add measure' }));
        await user.type(screen.getByLabelText('Yield quantity 1'), '2');
        await user.click(screen.getByLabelText('Save recipe'));

        expect(await screen.findByText('Please complete the yield')).not.toBeNull();
    });

    it('should remove a saved yield', async () => {
        renderComponent([mockUpdateRecipeAddYield, mockUpdateRecipeRemoveYield]);
        const user = userEvent.setup();

        await addYield(user);
        await enterViewRecipePage(screen, user, 'Mock Recipe', 'Instruction one.');
        await screen.findByLabelText('Recipe yield');
        await user.click(screen.getByLabelText('Navigate to home page'));

        // The saved rows load into the editor; removing both clears the yield.
        await enterEditRecipePage(screen, user, 'Mock Recipe', 'Instruction one.');
        expect(screen.getByLabelText('Yield quantity 1')).toHaveProperty('value', '2');
        await user.click(screen.getByLabelText('Remove yield row 2'));
        await user.click(screen.getByLabelText('Remove yield row 1'));
        await user.click(screen.getByLabelText('Save recipe'));

        await enterViewRecipePage(screen, user, 'Mock Recipe', 'Instruction one.');
        expect(screen.queryByLabelText('Recipe yield')).toBeNull();
    });
});
