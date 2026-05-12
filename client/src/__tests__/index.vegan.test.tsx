import { userEvent } from '@testing-library/user-event';
import { afterEach, describe, expect, it } from 'vitest';
import { cleanup, screen } from '@testing-library/react';
import { loadDevMessages, loadErrorMessages } from '@apollo/client/dev';

import { PATH } from '@recipe/constants';
import { enterEditRecipePage } from '@recipe/utils/tests';
import { MockedResponses, renderPage } from '@recipe/utils/tests';
import { mockGetRecipes } from '@recipe/graphql/queries/__mocks__/recipe';
import { mockGetRecipeOne } from '@recipe/graphql/queries/__mocks__/recipe';
import { mockUpdateRecipeOneNoChange } from '@recipe/graphql/mutations/__mocks__/recipe';
import { mockGetRecipeWithVeganVersion } from '@recipe/graphql/queries/__mocks__/recipe';
import { mockGetRecipeThree, mockGetRecipeTwo } from '@recipe/graphql/queries/__mocks__/recipe';

import { routes } from '../routes';
import { mocks, mocksMinimal } from '../__mocks__/graphql';

loadErrorMessages();
loadDevMessages();

/** Helper: render the app using mocksMinimal + a specific GET_RECIPE mock for mock-recipe-one */
function renderWithRecipeMock(...extraMocks: MockedResponses) {
    return renderPage(
        routes,
        [...mocksMinimal, ...extraMocks, mockGetRecipeTwo, mockGetRecipeThree, mockGetRecipes],
        [PATH.ROOT]
    );
}

describe('EditRecipe — Vegan Version Checkbox Visibility', () => {
    afterEach(() => {
        cleanup();
    });

    it('should show the vegan version checkbox for a normal recipe without a vegan version', async () => {
        // mockRecipeOne has veganVersion: null and originalRecipe: null
        renderWithRecipeMock(mockGetRecipeOne);
        const user = userEvent.setup();

        await enterEditRecipePage(screen, user, 'Mock Recipe', 'Instruction one.');

        expect(await screen.findByLabelText('Create vegan version of this recipe')).not.toBeNull();
    });

    it('should hide the vegan version checkbox when the recipe already has a vegan version', async () => {
        renderWithRecipeMock(mockGetRecipeWithVeganVersion);
        const user = userEvent.setup();

        await enterEditRecipePage(screen, user, 'Mock Recipe', 'Instruction one.');

        expect(screen.queryByLabelText('Create vegan version of this recipe')).toBeNull();
    });

    it('should hide the vegan version checkbox when the recipe is itself a vegan copy', async () => {
        // Construct a mock that serves a vegan copy (originalRecipe set) for the
        // standard mock-recipe-one query, so the edit page loads with originalRecipe set.
        const { GET_RECIPE } = await import('@recipe/graphql/queries/recipe');
        const { mockRecipeVeganCopy } = await import('@recipe/graphql/queries/__mocks__/recipe');
        const mockGetVeganCopyAtRecipeOne = {
            request: {
                query: GET_RECIPE,
                variables: { filter: { titleIdentifier: 'mock-recipe-one' } },
            },
            result: {
                data: { __typename: 'Query', recipeOne: mockRecipeVeganCopy },
            },
        };
        renderWithRecipeMock(mockGetVeganCopyAtRecipeOne);
        const user = userEvent.setup();

        await enterEditRecipePage(screen, user, 'Mock Recipe', 'Instruction one.');

        expect(screen.queryByLabelText('Create vegan version of this recipe')).toBeNull();
    });
});

describe('EditRecipe — Already Vegan Guard', () => {
    afterEach(() => {
        cleanup();
    });

    it('should show a warning toast and redirect home when saving a recipe that is already vegan', async () => {
        // mockRecipeOne has calculatedTags: ['vegan', 'vegetarian']
        renderPage(routes, [...mocks, mockUpdateRecipeOneNoChange], [PATH.ROOT]);
        const user = userEvent.setup();

        await enterEditRecipePage(screen, user, 'Mock Recipe', 'Instruction one.');

        // Check the vegan version checkbox
        await user.click(await screen.findByLabelText('Create vegan version of this recipe'));

        // Save the recipe
        await user.click(screen.getByLabelText('Save recipe'));

        // Warning toast should appear
        expect(await screen.findByText('Recipe is already vegan')).not.toBeNull();
        expect(await screen.findByText('This recipe does not need a vegan version')).not.toBeNull();

        // Should navigate to home page
        expect(await screen.findByText('Recipes')).not.toBeNull();
    });
});

describe('Home page — hide vegan copies', () => {
    afterEach(() => {
        cleanup();
    });

    it('should not show vegan copies on the home page', async () => {
        // mockRecipeOne has calculatedTags: ['vegan', 'vegetarian']
        const { GET_RECIPES } = await import('@recipe/graphql/queries/recipe');
        const { mockRecipeOne, mockRecipeTwo, mockRecipeThree, mockRecipeFour } = await import(
            '@recipe/graphql/queries/__mocks__/recipe'
        );
        // A mock that only matches when originalRecipe: null is in the filter — i.e. the
        // filter we expect the UI to send after the fix.
        const mockGetRecipesNoVeganCopies = {
            request: {
                query: GET_RECIPES,
                variables: {
                    offset: 0,
                    limit: 5,
                    filter: { archived: false, originalRecipe: null },
                    countFilter: { archived: false, originalRecipe: null },
                },
            },
            result: {
                data: {
                    __typename: 'Query',
                    recipeMany: [mockRecipeOne, mockRecipeTwo, mockRecipeThree, mockRecipeFour],
                    recipeCount: 4,
                },
            },
        };
        renderPage(
            routes,
            [...mocksMinimal, mockGetRecipesNoVeganCopies, mockGetRecipeTwo, mockGetRecipeThree],
            [PATH.ROOT]
        );

        // The recipe list should render. If the mock didn't match (no originalRecipe: null in
        // filter), Apollo would find no mock and the list would be empty/errored.
        expect(await screen.findByText('Mock Recipe')).not.toBeNull();
        // Verify no Apollo error toast appeared
        expect(screen.queryByText('No results')).toBeNull();
    });
});

describe('CreateVeganRecipe — Page', () => {
    afterEach(() => {
        cleanup();
    });

    it('should render the create vegan recipe page with Submit Vegan Version button', async () => {
        renderPage(routes, [...mocks], [`${PATH.ROOT}/create/recipe/vegan/mock-recipe-one`]);

        expect(await screen.findByText('Submit Vegan Version')).not.toBeNull();
    });

    it('should pre-populate the title field from the original recipe', async () => {
        renderPage(routes, [...mocks], [`${PATH.ROOT}/create/recipe/vegan/mock-recipe-one`]);

        // The title input should be pre-filled with the original recipe title
        expect(await screen.findByDisplayValue('Mock Recipe')).not.toBeNull();
    });
});
