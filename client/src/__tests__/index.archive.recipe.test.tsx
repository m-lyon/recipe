import { userEvent } from '@testing-library/user-event';
import { cleanup, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { loadDevMessages, loadErrorMessages } from '@apollo/client/dev';

import { enterViewRecipePage } from '@recipe/utils/tests';
import { mockArchiveRecipeOne } from '@recipe/graphql/mutations/__mocks__/recipe';
import { mockArchiveRecipeTwo } from '@recipe/graphql/mutations/__mocks__/recipe';

import { renderComponent } from './utils';

loadErrorMessages();
loadDevMessages();

describe('Archive Recipe Workflow', () => {
    afterEach(() => {
        cleanup();
    });

    it('should archive a recipe only', async () => {
        // Render -----------------------------------------------
        renderComponent([mockArchiveRecipeOne]);
        const user = userEvent.setup();

        // Act --------------------------------------------------
        expect(await screen.findByText('Recipes'));
        await user.hover(await screen.findByLabelText('View Mock Recipe'));
        await user.click(screen.getByLabelText('Archive Mock Recipe'));
        await user.click(screen.getByLabelText('Confirm archive action'));

        // Expect ------------------------------------------------
        expect(await screen.findByText('Recipes')).not.toBeNull();
        expect(screen.queryByText('Mock Recipe')).toBeNull();
    });

    it('should archive a recipe that is an ingredient', async () => {
        // Render -----------------------------------------------
        renderComponent([mockArchiveRecipeTwo]);
        const user = userEvent.setup();

        // Act --------------------------------------------------
        expect(await screen.findByText('Recipes'));
        await user.hover(await screen.findByLabelText('View Mock Recipe Two'));
        await user.click(screen.getByLabelText('Archive Mock Recipe Two'));
        await user.click(screen.getByLabelText('Confirm archive action'));

        // Expect ------------------------------------------------
        // ------ Home Page --------------------------------------
        expect(await screen.findByText('Recipes')).not.toBeNull();
        expect(screen.queryByText('Mock Recipe Two')).toBeNull();

        // ------ Ingredient List --------------------------------
        await user.click(screen.getAllByLabelText('Create new recipe')[0]);
        expect(await screen.findByText('Enter Recipe Title')).not.toBeNull();
        await user.click(screen.getByLabelText('Enter ingredient #1 for subsection 1'));
        await user.keyboard('{2}{ }');
        await user.click(await screen.findByText('skip unit'));
        expect(screen.queryByText('mock recipes two')).toBeNull();
    });

    it('should archive a recipe after viewing', async () => {
        // Render -----------------------------------------------
        renderComponent([mockArchiveRecipeOne]);
        const user = userEvent.setup();

        // Act --------------------------------------------------
        await enterViewRecipePage(screen, user, 'Mock Recipe', 'Instruction one.');
        await user.click(screen.getByLabelText('Navigate to home page'));
        await user.hover(await screen.findByLabelText('View Mock Recipe'));
        await user.click(screen.getByLabelText('Archive Mock Recipe'));
        await user.click(screen.getByLabelText('Confirm archive action'));

        // Expect ------------------------------------------------
        expect(await screen.findByText('Recipes')).not.toBeNull();
        expect(screen.queryByText('Mock Recipe')).toBeNull();
    });
});
