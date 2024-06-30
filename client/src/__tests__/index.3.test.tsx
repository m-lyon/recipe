import { ChakraProvider } from '@chakra-ui/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';
import { RouterProvider, createMemoryRouter } from 'react-router-dom';
import { loadDevMessages, loadErrorMessages } from '@apollo/client/dev';
import { MockedProvider, MockedResponse } from '@apollo/client/testing';

import { ROOT_PATH } from '@recipe/constants';
import { getCache } from '@recipe/utils/cache';
import { UserProvider } from '@recipe/features/user';
import { mockGetTags } from '@recipe/graphql/queries/__mocks__/tag';
import { mockGetUnits } from '@recipe/graphql/queries/__mocks__/unit';
import { mockGetCurrentUser } from '@recipe/graphql/queries/__mocks__/user';
import { mockGetRecipeThree } from '@recipe/graphql/queries/__mocks__/recipe';
import { mockGetPrepMethods } from '@recipe/graphql/queries/__mocks__/prepMethod';
import { mockGetIngredients } from '@recipe/graphql/queries/__mocks__/ingredient';
import { mockGetRatingsRecipeOne } from '@recipe/graphql/queries/__mocks__/rating';
import { mockGetRatingsRecipeTwo } from '@recipe/graphql/queries/__mocks__/rating';
import { mockGetRatingsRecipeThree } from '@recipe/graphql/queries/__mocks__/rating';
import { mockUpdateRecipeAddNote } from '@recipe/graphql/mutations/__mocks__/recipe';
import { mockUpdateRecipeRemoveNotes } from '@recipe/graphql/mutations/__mocks__/recipe';
import { mockUpdateRecipeUpdateNotes } from '@recipe/graphql/mutations/__mocks__/recipe';
import { mockUpdateRecipeInstructions } from '@recipe/graphql/mutations/__mocks__/recipe';
import { mockGetUnitConversions } from '@recipe/graphql/queries/__mocks__/unitConversion';
import { mockGetRecipeTwo, mockGetRecipes } from '@recipe/graphql/queries/__mocks__/recipe';
import { mockCountRecipes, mockGetRecipeOne } from '@recipe/graphql/queries/__mocks__/recipe';

import { routes } from '../routes';

loadErrorMessages();
loadDevMessages();

const renderComponent = (
    mockedResponses: MockedResponse<Record<string, any>, Record<string, any>>[] = []
) => {
    render(
        <MockedProvider
            mocks={[
                mockGetCurrentUser,
                mockGetUnits,
                mockGetIngredients,
                mockGetPrepMethods,
                mockGetTags,
                mockGetUnitConversions,
                mockGetRecipeOne,
                mockGetRecipeTwo,
                mockGetRecipeThree,
                mockGetRecipes,
                mockCountRecipes,
                mockGetRatingsRecipeOne,
                mockGetRatingsRecipeTwo,
                mockGetRatingsRecipeThree,
                ...mockedResponses,
            ]}
            cache={getCache()}
        >
            <ChakraProvider>
                <UserProvider>
                    <RouterProvider
                        router={createMemoryRouter(routes, {
                            initialEntries: [ROOT_PATH],
                        })}
                    />
                </UserProvider>
            </ChakraProvider>
        </MockedProvider>
    );
};

describe('Update Recipe Workflow', () => {
    afterEach(() => {
        cleanup();
    });

    it('should update the instructions', async () => {
        // Render -----------------------------------------------
        renderComponent([mockUpdateRecipeInstructions]);
        const user = userEvent.setup();

        // Act --------------------------------------------------
        await user.hover(await screen.findByLabelText('View Mock Recipe'));
        await user.click(screen.getByLabelText('Edit Mock Recipe'));
        expect(await screen.findByText('Instruction one')).not.toBeNull();
        await user.click(screen.getByLabelText('Edit instruction 2'));
        await user.keyboard('{Backspace}{Backspace}{Backspace}{Backspace}'); // remove 'Inst'
        await user.keyboard('{Backspace}{Backspace}{Backspace}{Backspace}'); // remove 'ruct'
        await user.keyboard('{Backspace}{Backspace}{Backspace}{Backspace}'); // remove 'ion '
        await user.keyboard('{Backspace}{Backspace}{Backspace}'); // remove 'Two'
        await user.keyboard('New instruction');
        await user.click(screen.getByLabelText('Save recipe'));

        // Expect ------------------------------------------------
        // ------ Home Page --------------------------------------
        expect(await screen.findByText('Recipes')).not.toBeNull();
        // ------ View Recipe Page -------------------------------
        await user.click(screen.getByLabelText('View Mock Recipe'));
        expect(await screen.findByText('New instruction.')).not.toBeNull();
        await user.click(screen.getByLabelText('Navigate to home page'));
        // ------ Edit Recipe Page -------------------------------
        await user.hover(await screen.findByLabelText('View Mock Recipe'));
        await user.click(screen.getByLabelText('Edit Mock Recipe'));
        expect(await screen.findByText('New instruction.')).not.toBeNull();
    });

    it('should add a note', async () => {
        // Render -----------------------------------------------
        renderComponent([mockUpdateRecipeAddNote]);
        const user = userEvent.setup();

        // Act --------------------------------------------------
        await user.hover(await screen.findByLabelText('View Mock Recipe'));
        await user.click(screen.getByLabelText('Edit Mock Recipe'));
        expect(await screen.findByText('Instruction one')).not.toBeNull();
        await user.click(screen.getByLabelText('Edit recipe notes'));
        await user.keyboard('A new note{Enter}');
        await user.click(screen.getByLabelText('Save recipe'));

        // Expect ------------------------------------------------
        // ------ Home Page --------------------------------------
        expect(await screen.findByText('Recipes')).not.toBeNull();
        // ------ View Recipe Page -------------------------------
        await user.click(screen.getByLabelText('View Mock Recipe'));
        expect(await screen.findByText('A new note.')).not.toBeNull();
        await user.click(screen.getByLabelText('Navigate to home page'));
        // ------ Edit Recipe Page -------------------------------
        await user.hover(await screen.findByLabelText('View Mock Recipe'));
        await user.click(screen.getByLabelText('Edit Mock Recipe'));
        expect(await screen.findByText('A new note.')).not.toBeNull();
    });

    it('should remove a note', async () => {
        // Render -----------------------------------------------
        renderComponent([mockUpdateRecipeRemoveNotes]);
        const user = userEvent.setup();

        // Act --------------------------------------------------
        await user.hover(await screen.findByLabelText('View Mock Recipe Three'));
        await user.click(screen.getByLabelText('Edit Mock Recipe Three'));
        expect(await screen.findByText('Instruction one')).not.toBeNull();
        expect(screen.getByLabelText('Edit recipe notes')).toHaveProperty('value', 'Notes');
        await user.click(screen.getByLabelText('Edit recipe notes'));
        await user.keyboard('{Backspace}{Backspace}{Backspace}{Backspace}{Backspace}{Backspace}');
        await user.click(screen.getByLabelText('Save recipe'));

        // Expect ------------------------------------------------
        // ------ Home Page --------------------------------------
        expect(await screen.findByText('Recipes')).not.toBeNull();
        // ------ View Recipe Page -------------------------------
        await user.click(screen.getByLabelText('View Mock Recipe Three'));
        expect(await screen.findByText('Instruction one')).not.toBeNull();
        expect(screen.queryByText('Notes:')).toBeNull();
        await user.click(screen.getByLabelText('Navigate to home page'));
        // ------ Edit Recipe Page -------------------------------
        await user.hover(await screen.findByLabelText('View Mock Recipe Three'));
        await user.click(screen.getByLabelText('Edit Mock Recipe Three'));
        expect(await screen.findByText('Instruction one')).not.toBeNull();
        expect(screen.getByLabelText('Edit recipe notes')).toHaveProperty('value', '');
    });

    it('should update the notes', async () => {
        // Render -----------------------------------------------
        renderComponent([mockUpdateRecipeUpdateNotes]);
        const user = userEvent.setup();

        // Act --------------------------------------------------
        await user.hover(await screen.findByLabelText('View Mock Recipe Three'));
        await user.click(screen.getByLabelText('Edit Mock Recipe Three'));
        expect(await screen.findByText('Instruction one')).not.toBeNull();
        await user.click(screen.getByLabelText('Edit recipe notes'));
        await user.keyboard('{Backspace}{Backspace}{Backspace}{Backspace}{Backspace}{Backspace}');
        await user.keyboard('A new note.');
        await user.click(screen.getByLabelText('Save recipe'));

        // Expect ------------------------------------------------
        // ------ Home Page --------------------------------------
        expect(await screen.findByText('Recipes')).not.toBeNull();
        // ------ View Recipe Page -------------------------------
        await user.click(screen.getByLabelText('View Mock Recipe Three'));
        expect(await screen.findByText('A new note.')).not.toBeNull();
        await user.click(screen.getByLabelText('Navigate to home page'));
        // ------ Edit Recipe Page -------------------------------
        await user.hover(await screen.findByLabelText('View Mock Recipe Three'));
        await user.click(screen.getByLabelText('Edit Mock Recipe Three'));
        expect(await screen.findByText('A new note.')).not.toBeNull();
    });
});
