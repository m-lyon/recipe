import createFetchMock from 'vitest-fetch-mock';
import { userEvent } from '@testing-library/user-event';
import { cleanup, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { loadDevMessages, loadErrorMessages } from '@apollo/client/dev';

import { enterEditRecipePage } from '@recipe/utils/tests';
import { mockGetRecipePrepAhead } from '@recipe/graphql/queries/__mocks__/recipe';
import { mockZeroLinkedRecipeOne } from '@recipe/graphql/queries/__mocks__/recipe';
import { mockUpdateRecipeOneNoChange } from '@recipe/graphql/mutations/__mocks__/recipe';
import { mockUpdateRecipeAddPrepAhead } from '@recipe/graphql/mutations/__mocks__/recipe';
import { mockUpdateRecipeRemovePrepAhead } from '@recipe/graphql/mutations/__mocks__/recipe';

import { renderComponent } from './utils';

const fetchMocker = createFetchMock(vi);
fetchMocker.enableMocks();

loadErrorMessages();
loadDevMessages();

describe('Update Recipe Workflow: Prep Ahead', () => {
    afterEach(() => {
        cleanup();
    });

    it('should update recipe to enable prep ahead', async () => {
        // Render -----------------------------------------------
        renderComponent([mockUpdateRecipeAddPrepAhead, mockZeroLinkedRecipeOne]);
        const user = userEvent.setup();

        // Act --------------------------------------------------
        await enterEditRecipePage(screen, user, 'Mock Recipe', 'Instruction one.');
        await user.click(screen.getByLabelText('Toggle recipe as ingredient'));
        await user.click(screen.getByLabelText('Edit recipe plural title'));
        await user.keyboard('Mock Recipes');
        await user.click(screen.getByLabelText('Toggle prep ahead'));
        await user.click(screen.getByLabelText('Edit prep ahead label'));
        await user.keyboard('1 day');
        await user.click(screen.getByLabelText('Save recipe'));

        // Expect ------------------------------------------------
        // ------ Home Page --------------------------------------
        expect(await screen.findByText('Recipes')).not.toBeNull();
        expect(screen.queryByText('Mock Recipes')).not.toBeNull();
        expect(screen.queryByText('prep ahead')).not.toBeNull();
    });

    it('should update recipe to disable prep ahead', async () => {
        // Render -----------------------------------------------
        renderComponent([mockUpdateRecipeRemovePrepAhead, mockGetRecipePrepAhead]);
        const user = userEvent.setup();

        // Act --------------------------------------------------
        await enterEditRecipePage(screen, user, 'Mock Recipe Prep Ahead', 'Instruction one.');
        await user.click(screen.getByLabelText('Toggle prep ahead'));
        await user.click(screen.getByLabelText('Save recipe'));

        // Expect ------------------------------------------------
        // ------ Home Page --------------------------------------
        expect(await screen.findByText('Recipes')).not.toBeNull();
        expect(screen.queryByText('prep ahead')).toBeNull();
    });

    it('should disable prep ahead when isIngredient is toggled off', async () => {
        // Render -----------------------------------------------
        renderComponent([mockUpdateRecipeOneNoChange, mockZeroLinkedRecipeOne]);
        const user = userEvent.setup();

        // Act --------------------------------------------------
        await enterEditRecipePage(screen, user, 'Mock Recipe', 'Instruction one.');
        await user.click(screen.getByLabelText('Toggle recipe as ingredient'));
        await user.click(screen.getByLabelText('Toggle prep ahead'));
        // Toggle isIngredient off — should reset prep ahead
        await user.click(screen.getByLabelText('Toggle recipe as ingredient'));
        await user.click(screen.getByLabelText('Save recipe'));

        // Expect ------------------------------------------------
        // ------ Home Page --------------------------------------
        expect(await screen.findByText('Recipes')).not.toBeNull();
        expect(screen.queryByText('prep ahead')).toBeNull();
    });
});
