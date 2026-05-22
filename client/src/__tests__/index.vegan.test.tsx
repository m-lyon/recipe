import { userEvent } from '@testing-library/user-event';
import { afterEach, describe, expect, it } from 'vitest';
import { act, cleanup, screen, waitFor } from '@testing-library/react';
import { loadDevMessages, loadErrorMessages } from '@apollo/client/dev';

import { PATH } from '@recipe/constants';
import { ReservedTags } from '@recipe/graphql/enums';
import { enterEditRecipePage } from '@recipe/utils/tests';
import { enterViewRecipePage } from '@recipe/utils/tests';
import { UPDATE_RECIPE } from '@recipe/graphql/mutations/recipe';
import { MockedResponses, renderPage } from '@recipe/utils/tests';
import { GET_RECIPE, GET_RECIPES } from '@recipe/graphql/queries/recipe';
import { mockGetRecipes } from '@recipe/graphql/queries/__mocks__/recipe';
import { mockRecipeThree } from '@recipe/graphql/queries/__mocks__/recipe';
import { mockGetRecipeOne } from '@recipe/graphql/queries/__mocks__/recipe';
import { mockRecipeVeganCopy } from '@recipe/graphql/queries/__mocks__/recipe';
import { mockGetRenamedRecipe } from '@recipe/graphql/queries/__mocks__/recipe';
import { mockGetRecipeVeganCopy } from '@recipe/graphql/queries/__mocks__/recipe';
import { mockArchiveRecipeOne } from '@recipe/graphql/mutations/__mocks__/recipe';
import { mockRecipeWithVeganVersion } from '@recipe/graphql/queries/__mocks__/recipe';
import { mockDeleteRecipeVeganCopy } from '@recipe/graphql/mutations/__mocks__/recipe';
import { mockGetOldRecipeSlugNotFound } from '@recipe/graphql/queries/__mocks__/recipe';
import { mockRecipeOne, mockRecipeTwo } from '@recipe/graphql/queries/__mocks__/recipe';
import { mockGetRecipeWithVeganVersion } from '@recipe/graphql/queries/__mocks__/recipe';
import { mockUpdateRecipeOneNoChange } from '@recipe/graphql/mutations/__mocks__/recipe';
import { mockUpdateRecipeOneNowVegan } from '@recipe/graphql/mutations/__mocks__/recipe';
import { mockRecipeFive, mockRecipeFour } from '@recipe/graphql/queries/__mocks__/recipe';
import { mockUpdateRecipeOneWithRename } from '@recipe/graphql/mutations/__mocks__/recipe';
import { mockCreateVeganRecipeViaMutation } from '@recipe/graphql/mutations/__mocks__/recipe';
import { mockGetRecipesAfterArchiveRecipeOne } from '@recipe/graphql/queries/__mocks__/recipe';
import { mockGetRecipeThree, mockGetRecipeTwo } from '@recipe/graphql/queries/__mocks__/recipe';
import { mockGetRecipesAfterDeleteVeganVersion } from '@recipe/graphql/queries/__mocks__/recipe';

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

    it('should show a pre-checked "Edit vegan version" checkbox when recipe has a vegan version', async () => {
        renderWithRecipeMock(mockGetRecipeWithVeganVersion);
        const user = userEvent.setup();

        await enterEditRecipePage(screen, user, 'Mock Recipe', 'Instruction one.');

        const checkbox = await screen.findByLabelText('Edit vegan version of this recipe');
        expect(checkbox).not.toBeNull();
        await waitFor(() => expect((checkbox as HTMLInputElement).checked).toBe(true));
    });

    it('should allow unchecking the "Edit vegan version" checkbox', async () => {
        renderWithRecipeMock(mockGetRecipeWithVeganVersion);
        const user = userEvent.setup();

        await enterEditRecipePage(screen, user, 'Mock Recipe', 'Instruction one.');

        const checkbox = await screen.findByLabelText('Edit vegan version of this recipe');
        await user.click(checkbox);
        await waitFor(() => expect((checkbox as HTMLInputElement).checked).toBe(false));
    });

    it('should not show the "Create vegan version" label when the recipe already has a vegan version', async () => {
        renderWithRecipeMock(mockGetRecipeWithVeganVersion);
        const user = userEvent.setup();

        await enterEditRecipePage(screen, user, 'Mock Recipe', 'Instruction one.');

        expect(screen.queryByLabelText('Create vegan version of this recipe')).toBeNull();
    });

    it('should hide the vegan version checkbox when the recipe is itself a vegan copy', async () => {
        // Construct a mock that serves a vegan copy (originalRecipe set) for the
        // standard mock-recipe-one query, so the edit page loads with originalRecipe set.

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

describe('ViewRecipe — vegan copy title', () => {
    afterEach(() => {
        cleanup();
    });

    it('should not append (Vegan) to the title of a vegan copy', async () => {
        renderPage(
            routes,
            [...mocks, mockGetRecipeVeganCopy],
            [`${PATH.ROOT}/view/recipe/mock-recipe-one-vegan`]
        );
        expect(await screen.findByText('Mock Recipe')).not.toBeNull();
        expect(screen.queryByText('Mock Recipe (Vegan)')).toBeNull();
    });
});

describe('ViewRecipe — linked vegan navigation action', () => {
    afterEach(() => {
        cleanup();
    });

    it('should show a plant icon action on an original recipe with a vegan version and hide the old text link', async () => {
        renderPage(
            routes,
            [...mocksMinimal, mockGetRecipeWithVeganVersion],
            [`${PATH.ROOT}/view/recipe/mock-recipe-one`]
        );

        expect(await screen.findByText('Mock Recipe')).not.toBeNull();
        expect(await screen.findByLabelText('View vegan version')).not.toBeNull();
        expect(screen.queryByText('View Vegan Version')).toBeNull();
    });

    it('should show a meat icon action on a vegan copy with an original recipe and hide the old text link', async () => {
        renderPage(
            routes,
            [...mocksMinimal, mockGetRecipeVeganCopy],
            [`${PATH.ROOT}/view/recipe/mock-recipe-one-vegan`]
        );

        expect(await screen.findByText('Mock Recipe')).not.toBeNull();
        expect(await screen.findByLabelText('View original recipe')).not.toBeNull();
        expect(screen.queryByText('View Original Recipe')).toBeNull();
    });

    it('should navigate to the linked recipe when the icon action is clicked', async () => {
        renderPage(
            routes,
            [...mocksMinimal, mockGetRecipeWithVeganVersion, mockGetRecipeVeganCopy],
            [`${PATH.ROOT}/view/recipe/mock-recipe-one`]
        );
        const user = userEvent.setup();

        await screen.findByText('Mock Recipe');
        await user.click(await screen.findByLabelText('View vegan version'));

        await waitFor(() => {
            expect(screen.getByLabelText('View original recipe')).not.toBeNull();
        });
    });
});

describe('RecipeCard — no vegan version button', () => {
    afterEach(() => {
        cleanup();
    });

    it('should not show the "View vegan version" button on a recipe card', async () => {
        const mockGetRecipesWithVeganVersion = {
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
                    recipeMany: [mockRecipeWithVeganVersion],
                    recipeCount: 1,
                },
            },
        };
        renderPage(routes, [...mocksMinimal, mockGetRecipesWithVeganVersion], [PATH.ROOT]);

        expect(await screen.findByText('Mock Recipe')).not.toBeNull();
        expect(screen.queryByLabelText('View vegan version of Mock Recipe')).toBeNull();
    });
});

describe('ViewRecipe — recipe ingredient vegan suffix', () => {
    afterEach(() => {
        cleanup();
    });

    it('renders (ve) for recipe ingredients whose nested recipe has a vegan version', async () => {
        const recipeWithRecipeIngredient = {
            ...mockRecipeOne,
            ingredientSubsections: [
                {
                    __typename: 'IngredientSubsection' as const,
                    name: 'Section One',
                    ingredients: [
                        {
                            ...mockRecipeOne.ingredientSubsections[0].ingredients[0],
                            __typename: 'RecipeIngredient' as const,
                            ingredient: {
                                __typename: 'Recipe' as const,
                                _id: 'mock-recipe-ingredient-with-vegan-version',
                                title: 'Mock Stock',
                                pluralTitle: null,
                                veganVersion: {
                                    __typename: 'Recipe' as const,
                                    _id: 'mock-recipe-ingredient-vegan-copy',
                                },
                            },
                        },
                    ],
                },
            ],
        };
        const mockGetRecipeWithRecipeIngredient = {
            request: {
                query: GET_RECIPE,
                variables: { filter: { titleIdentifier: 'mock-recipe-one' } },
            },
            result: {
                data: {
                    __typename: 'Query',
                    recipeOne: recipeWithRecipeIngredient,
                },
            },
        };

        renderPage(
            routes,
            [
                ...mocksMinimal,
                mockGetRecipeWithRecipeIngredient,
                mockGetRecipeTwo,
                mockGetRecipeThree,
                mockGetRecipes,
            ],
            [PATH.ROOT]
        );
        const user = userEvent.setup();

        await enterViewRecipePage(screen, user, 'Mock Recipe', 'Instruction one.');

        expect((await screen.findByLabelText('View Mock Stock')).textContent).toContain(
            'mock stock (ve)'
        );
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

    it('pre-populates all ingredient and instruction subsections from the original recipe', async () => {
        const recipeWithMultipleSubsections = {
            ...mockRecipeOne,
            ingredientSubsections: [
                {
                    __typename: 'IngredientSubsection' as const,
                    name: 'Sauce',
                    ingredients: [mockRecipeOne.ingredientSubsections[0].ingredients[0]],
                },
                {
                    __typename: 'IngredientSubsection' as const,
                    name: 'Topping',
                    ingredients: [mockRecipeOne.ingredientSubsections[0].ingredients[1]],
                },
            ],
            instructionSubsections: [
                {
                    __typename: 'InstructionSubsection' as const,
                    name: 'Prep',
                    instructions: ['Chop vegetables'],
                },
                {
                    __typename: 'InstructionSubsection' as const,
                    name: 'Cook',
                    instructions: ['Cook vegetables'],
                },
            ],
        };
        const mockGetRecipeWithSubsections = {
            request: {
                query: GET_RECIPE,
                variables: { filter: { titleIdentifier: 'mock-recipe-one' } },
            },
            result: {
                data: {
                    __typename: 'Query',
                    recipeOne: recipeWithMultipleSubsections,
                },
            },
        };

        renderPage(
            routes,
            [...mocksMinimal, mockGetRecipeWithSubsections],
            [`${PATH.ROOT}/create/recipe/vegan/mock-recipe-one`]
        );

        expect(await screen.findByDisplayValue('Sauce')).not.toBeNull();
        expect(screen.getByDisplayValue('Topping')).not.toBeNull();
        expect(screen.getByDisplayValue('Prep')).not.toBeNull();
        expect(screen.getByDisplayValue('Cook')).not.toBeNull();
    });

    it('should navigate to home page after successfully submitting a vegan version', async () => {
        renderPage(
            routes,
            [...mocksMinimal, mockGetRecipeOne, mockCreateVeganRecipeViaMutation, mockGetRecipes],
            [`${PATH.ROOT}/create/recipe/vegan/mock-recipe-one`]
        );
        const user = userEvent.setup();
        await user.click(await screen.findByText('Submit Vegan Version'));
        expect(await screen.findByText('Recipes')).not.toBeNull();
    });
});

describe('CreateVeganRecipe — cache: originalRecipe on vegan copy', () => {
    afterEach(() => {
        cleanup();
    });

    it('should not show the vegan copy on the home page after creation', async () => {
        renderPage(
            routes,
            [...mocksMinimal, mockGetRecipeOne, mockCreateVeganRecipeViaMutation, mockGetRecipes],
            [`${PATH.ROOT}/create/recipe/vegan/mock-recipe-one`]
        );
        const user = userEvent.setup();
        await user.click(await screen.findByText('Submit Vegan Version'));
        // After navigation, we're on the home page.
        await screen.findByText('Recipes');
        // The home page GET_RECIPES mock returns exactly 4 recipes (no vegan copy).
        // Assert that exactly those 4 recipe cards are rendered — if the vegan copy
        // were incorrectly shown, there would be an extra card.
        const cards = screen.queryAllByLabelText(/^View /);
        expect(cards).toHaveLength(mockGetRecipes.result.data.recipeMany.length);
    });
});

describe('CreateVeganRecipe — cache update after atomic create', () => {
    afterEach(() => {
        cleanup();
    });

    it('creates and links the vegan copy with one mutation', async () => {
        const { router } = renderPage(
            routes,
            [...mocksMinimal, mockGetRecipeOne, mockCreateVeganRecipeViaMutation, mockGetRecipes],
            [`${PATH.ROOT}/create/recipe/vegan/mock-recipe-one`]
        );

        const user = userEvent.setup();
        await user.click(await screen.findByLabelText('Save recipe'));

        expect(await screen.findByText('Vegan version created')).not.toBeNull();
        await waitFor(() => {
            expect(router.state.location.pathname).toBe(PATH.ROOT);
        });
        await waitFor(() => {
            expect(screen.queryAllByLabelText(/^View /)).toHaveLength(
                mockGetRecipes.result.data.recipeMany.length
            );
        });
    });
});

describe('Home page — vegan tag filter includes recipes with vegan version', () => {
    afterEach(() => {
        cleanup();
    });

    it('should include recipes that have a vegan version when filtering by vegan tag', async () => {
        // Build the mock for the new OR-based vegan filter
        const mockFilterVeganInclVeganVersion = {
            AND: [
                { archived: false, originalRecipe: null },
                {
                    OR: [
                        { _operators: { calculatedTags: { in: [ReservedTags.Vegan] } } },
                        { _operators: { veganVersion: { exists: true } } },
                    ],
                },
            ],
        };
        const mockGetRecipesVegan = {
            request: {
                query: GET_RECIPES,
                variables: {
                    offset: 0,
                    limit: 5,
                    filter: mockFilterVeganInclVeganVersion,
                    countFilter: mockFilterVeganInclVeganVersion,
                },
            },
            result: {
                data: {
                    __typename: 'Query',
                    recipeMany: [mockRecipeOne, mockRecipeWithVeganVersion],
                    recipeCount: 2,
                },
            },
        };

        const user = userEvent.setup();
        renderPage(routes, [...mocksMinimal, mockGetRecipes, mockGetRecipesVegan], [PATH.ROOT]);
        // Click the Filter by tags button, then the vegan chip
        await screen.findByText('Recipes');
        await user.click(screen.getByLabelText('Filter by tags'));
        await user.click(await screen.findByLabelText('vegan'));

        // Both recipes should appear
        await waitFor(() => {
            const cards = screen.queryAllByLabelText(/^View /);
            expect(cards).toHaveLength(2);
        });
    });
});

describe('CreateVeganRecipe — cache: home page after vegan creation', () => {
    afterEach(() => {
        cleanup();
    });

    it('should show only the original recipe on the home page with the vegan version available tag after creating a vegan version', async () => {
        // Build a custom GET_RECIPES mock that returns mockRecipeOne with the
        // enum-backed calculatedTag already present. This simulates what
        // the server would return after the atomic create operation. When the user navigates
        // back to the home page after creating the vegan version, Apollo fires a fresh
        // GET_RECIPES (not yet cached since we started on the create-vegan page). The
        // cache.modify in the createVeganRecipe update adds the tag to the normalized
        // Recipe node, and this fresh query response confirms it.

        const mockGetRecipesAfterCreateVegan = {
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
                    recipeMany: [
                        {
                            ...mockRecipeOne,
                            calculatedTags: [
                                ReservedTags.Vegan,
                                'vegetarian',
                                ReservedTags.VeganVersionAvailable,
                            ],
                        },
                        mockRecipeTwo,
                        mockRecipeThree,
                        mockRecipeFour,
                    ],
                    recipeCount: 4,
                },
            },
        };

        // Start directly on the CreateVeganRecipe page. We replace the shared mockGetRecipes
        // with mockGetRecipesAfterLink so the home page shows the updated calculatedTags.
        renderPage(
            routes,
            [
                ...mocksMinimal,
                mockGetRecipeOne,
                mockGetRecipeTwo,
                mockGetRecipeThree,
                mockGetRecipesAfterCreateVegan,
                mockCreateVeganRecipeViaMutation,
            ],
            [`${PATH.ROOT}/create/recipe/vegan/mock-recipe-one`]
        );
        const user = userEvent.setup();
        await user.click(await screen.findByText('Submit Vegan Version'));

        // After navigation, we should be on the home page.
        await screen.findByText('Recipes');

        // Only the original 4 recipes should be shown — the vegan copy must NOT appear.
        const cards = screen.queryAllByLabelText(/^View /);
        expect(cards).toHaveLength(mockGetRecipes.result.data.recipeMany.length);

        // The original recipe card must be present.
        expect(screen.queryAllByLabelText('View Mock Recipe')).toHaveLength(1);

        // The original recipe card must display the 'vegan version available' calculated tag,
        // updated via cache.modify in the createVeganRecipe update callback.
        expect(screen.getByText('vegan version available')).not.toBeNull();
        expect(screen.queryByText('vegan_version_available')).toBeNull();
    });
});

describe('EditRecipe — toast when navigating to CreateVeganRecipe', () => {
    afterEach(() => {
        cleanup();
    });

    it('keeps Save enabled when the saved recipe is missing a title identifier', async () => {
        const mockGetRecipeOneNonVegan = {
            request: {
                query: GET_RECIPE,
                variables: { filter: { titleIdentifier: 'mock-recipe-one' } },
            },
            result: {
                data: {
                    __typename: 'Query',
                    recipeOne: { ...mockRecipeOne, calculatedTags: [], veganVersion: null },
                },
            },
        };
        const mockUpdateRecipeMissingTitleIdentifier = {
            request: { query: UPDATE_RECIPE },
            variableMatcher: () => true,
            result: {
                data: {
                    __typename: 'Mutation',
                    recipeUpdateById: {
                        __typename: 'UpdateByIdRecipePayload',
                        record: {
                            ...mockGetRecipeOneNonVegan.result.data.recipeOne,
                            titleIdentifier: null,
                        },
                    },
                },
            },
        };

        renderPage(
            routes,
            [
                ...mocksMinimal,
                mockGetRecipeOneNonVegan,
                mockGetRecipeTwo,
                mockGetRecipeThree,
                mockGetRecipes,
                mockUpdateRecipeMissingTitleIdentifier,
            ],
            [PATH.ROOT]
        );
        const user = userEvent.setup();

        await enterEditRecipePage(screen, user, 'Mock Recipe', 'Instruction one.');
        await user.click(screen.getByLabelText('Create vegan version of this recipe'));

        const saveButton = screen.getByLabelText('Save recipe');
        await user.click(saveButton);

        expect(
            await screen.findByText('No saved recipe was returned from the server')
        ).not.toBeNull();
        await waitFor(() => expect(saveButton).toBeEnabled());
    });

    it('should show a toast when saving a recipe with the create vegan version checkbox checked', async () => {
        // A non-vegan recipe with no existing vegan version so saving with the checkbox checked
        // triggers navigation to CreateVeganRecipe (not the warning toast).
        const mockRecipeOneNonVegan = { ...mockRecipeOne, calculatedTags: [], veganVersion: null };
        const mockGetRecipeOneNonVegan = {
            request: {
                query: GET_RECIPE,
                variables: { filter: { titleIdentifier: 'mock-recipe-one' } },
            },
            result: { data: { __typename: 'Query', recipeOne: mockRecipeOneNonVegan } },
        };
        const mockUpdateRecipeOneNonVegan = {
            request: { query: UPDATE_RECIPE },
            variableMatcher: () => true,
            result: {
                data: {
                    __typename: 'Mutation',
                    recipeUpdateById: {
                        __typename: 'UpdateByIdRecipePayload',
                        record: mockRecipeOneNonVegan,
                    },
                },
            },
        };

        renderPage(
            routes,
            [
                ...mocksMinimal,
                mockGetRecipeOneNonVegan,
                mockGetRecipeTwo,
                mockGetRecipeThree,
                mockGetRecipes,
                mockUpdateRecipeOneNonVegan,
            ],
            [PATH.ROOT]
        );
        const user = userEvent.setup();
        await enterEditRecipePage(screen, user, 'Mock Recipe', 'Instruction one.');
        await user.click(screen.getByLabelText('Create vegan version of this recipe'));
        await user.click(screen.getByLabelText('Save recipe'));
        expect(await screen.findByText('Creating vegan version')).not.toBeNull();
    });

    it('redirects vegan creation using the updated title identifier after a rename', async () => {
        const mockGetRecipeOneNonVegan = {
            request: {
                query: GET_RECIPE,
                variables: { filter: { titleIdentifier: 'mock-recipe-one' } },
            },
            result: {
                data: {
                    __typename: 'Query',
                    recipeOne: { ...mockRecipeOne, calculatedTags: [], veganVersion: null },
                },
            },
        };

        const { router } = renderPage(
            routes,
            [
                ...mocksMinimal,
                mockGetRecipeOneNonVegan,
                mockUpdateRecipeOneWithRename,
                mockGetOldRecipeSlugNotFound,
                mockGetRenamedRecipe,
            ],
            [`${PATH.ROOT}/edit/recipe/mock-recipe-one`]
        );
        const user = userEvent.setup();

        const titleInput = await screen.findByLabelText('Enter recipe title');
        await user.clear(titleInput);
        await user.type(titleInput, 'Mock Recipe Renamed');
        await user.click(screen.getByLabelText('Create vegan version of this recipe'));
        await user.click(screen.getByLabelText('Save recipe'));

        await screen.findByText('Creating vegan version');
        await waitFor(() => {
            expect(router.state.location.pathname).toBe(
                `${PATH.ROOT}/create/recipe/vegan/mock-recipe-renamed`
            );
        });
        expect(await screen.findByDisplayValue('Mock Recipe Renamed')).not.toBeNull();
        expect(screen.getByText('Submit Vegan Version')).not.toBeNull();
    });

    it('does not redirect to vegan-copy creation when the saved recipe becomes vegan', async () => {
        const mockGetRecipeOneNonVegan = {
            request: {
                query: GET_RECIPE,
                variables: { filter: { titleIdentifier: 'mock-recipe-one' } },
            },
            result: {
                data: {
                    __typename: 'Query',
                    recipeOne: { ...mockRecipeOne, calculatedTags: [], veganVersion: null },
                },
            },
        };

        const { router } = renderPage(
            routes,
            [
                ...mocksMinimal,
                mockGetRecipeOneNonVegan,
                mockGetRecipeTwo,
                mockGetRecipeThree,
                mockGetRecipes,
                mockUpdateRecipeOneNowVegan,
            ],
            [PATH.ROOT]
        );
        const user = userEvent.setup();

        await enterEditRecipePage(screen, user, 'Mock Recipe', 'Instruction one.');
        await user.click(screen.getByLabelText('Create vegan version of this recipe'));
        await user.click(screen.getByLabelText('Save recipe'));

        expect(await screen.findByText('Recipe is already vegan')).not.toBeNull();
        expect(screen.queryByText('Create Vegan Recipe')).toBeNull();
        await waitFor(() => {
            expect(router.state.location.pathname).toBe(PATH.ROOT);
        });
        expect(await screen.findByText('Recipes')).not.toBeNull();
    });
});

describe('EditRecipe — vegan checkbox stays checked after save', () => {
    afterEach(() => {
        cleanup();
    });

    it('should keep the "Edit vegan version" checkbox checked after clicking save', async () => {
        const mockUpdateWithVeganVersion = {
            request: { query: UPDATE_RECIPE },
            variableMatcher: () => true,
            result: {
                data: {
                    __typename: 'Mutation',
                    recipeUpdateById: {
                        __typename: 'UpdateByIdRecipePayload',
                        record: mockRecipeWithVeganVersion,
                    },
                },
            },
        };

        renderPage(
            routes,
            [
                ...mocksMinimal,
                mockGetRecipeWithVeganVersion,
                mockGetRecipeTwo,
                mockGetRecipeThree,
                mockGetRecipes,
                // Provide mockGetRecipeVeganCopy for when we land on the vegan edit page
                mockGetRecipeVeganCopy,
                mockUpdateWithVeganVersion,
            ],
            [PATH.ROOT]
        );
        const user = userEvent.setup();
        await enterEditRecipePage(screen, user, 'Mock Recipe', 'Instruction one.');

        const checkbox = await screen.findByLabelText('Edit vegan version of this recipe');
        await waitFor(() => expect((checkbox as HTMLInputElement).checked).toBe(true));

        await user.click(screen.getByLabelText('Save recipe'));

        // The toast fires, but the checkbox must still be checked during the redirect delay
        await screen.findByText('Redirecting to existing vegan version');
        expect((checkbox as HTMLInputElement).checked).toBe(true);
    });
});

describe('EditRecipe — save button enabled on vegan copy edit page after redirect', () => {
    afterEach(() => {
        cleanup();
    });

    it('should have an enabled save button after being redirected to the vegan version edit page', async () => {
        const mockUpdateWithVeganVersion = {
            request: { query: UPDATE_RECIPE },
            variableMatcher: () => true,
            result: {
                data: {
                    __typename: 'Mutation',
                    recipeUpdateById: {
                        __typename: 'UpdateByIdRecipePayload',
                        record: mockRecipeWithVeganVersion,
                    },
                },
            },
        };

        renderPage(
            routes,
            [
                ...mocksMinimal,
                mockGetRecipeWithVeganVersion,
                mockGetRecipeTwo,
                mockGetRecipeThree,
                mockGetRecipes,
                mockGetRecipeVeganCopy,
                mockUpdateWithVeganVersion,
            ],
            [PATH.ROOT]
        );
        const user = userEvent.setup();
        await enterEditRecipePage(screen, user, 'Mock Recipe', 'Instruction one.');

        // Wait for the checkbox to be pre-checked (veganVersion loaded)
        const checkbox = await screen.findByLabelText('Edit vegan version of this recipe');
        await waitFor(() => expect((checkbox as HTMLInputElement).checked).toBe(true));

        await user.click(screen.getByLabelText('Save recipe'));

        // Wait for redirect to vegan copy edit page
        await screen.findByText('Redirecting to existing vegan version');

        // Wait for navigation to the vegan copy edit page (mock-recipe-one-vegan)
        // The vegan copy page should load with the save button enabled
        await waitFor(
            () => {
                const saveButton = screen.getByLabelText('Save recipe');
                expect((saveButton as HTMLButtonElement).disabled).toBe(false);
            },
            { timeout: 5000 }
        );
    });
});

describe('EditRecipe — destructive action button', () => {
    afterEach(() => {
        cleanup();
    });

    it('should show Archive for an original recipe edit page and not Delete vegan version', async () => {
        renderPage(
            routes,
            [...mocksMinimal, mockGetRecipeWithVeganVersion],
            [`${PATH.ROOT}/edit/recipe/mock-recipe-one`]
        );

        expect(await screen.findByText('Mock Recipe')).not.toBeNull();
        expect(await screen.findByRole('button', { name: 'Archive recipe' })).not.toBeNull();
        expect(screen.queryByRole('button', { name: 'Delete vegan version' })).toBeNull();
    });

    it('should show Delete vegan version for a vegan copy edit page and not Archive', async () => {
        renderPage(
            routes,
            [...mocksMinimal, mockGetRecipeVeganCopy],
            [`${PATH.ROOT}/edit/recipe/mock-recipe-one-vegan`]
        );

        expect(await screen.findByText('Mock Recipe')).not.toBeNull();
        expect(await screen.findByRole('button', { name: 'Delete vegan version' })).not.toBeNull();
        expect(screen.queryByRole('button', { name: 'Archive recipe' })).toBeNull();
    });

    it('should open action-specific confirmation modal copy for archive and delete', async () => {
        const user = userEvent.setup();

        const { unmount } = renderPage(
            routes,
            [...mocksMinimal, mockGetRecipeWithVeganVersion],
            [`${PATH.ROOT}/edit/recipe/mock-recipe-one`]
        );

        await screen.findByText('Mock Recipe');
        await user.click(await screen.findByRole('button', { name: 'Archive recipe' }));

        expect(await screen.findByText('Archive Recipe')).not.toBeNull();
        expect(
            await screen.findByText(
                'Are you sure you want to archive this recipe? You can restore it later.'
            )
        ).not.toBeNull();
        expect(screen.getByRole('button', { name: 'Confirm archive action' })).toBeEnabled();
        await user.click(screen.getByRole('button', { name: 'Cancel archive action' }));

        unmount();

        renderPage(
            routes,
            [...mocksMinimal, mockGetRecipeVeganCopy],
            [`${PATH.ROOT}/edit/recipe/mock-recipe-one-vegan`]
        );

        await screen.findByText('Mock Recipe');
        await user.click(await screen.findByRole('button', { name: 'Delete vegan version' }));

        expect(await screen.findByText('Delete Vegan Version')).not.toBeNull();
        expect(
            await screen.findByText(
                'Are you sure you want to delete this vegan version? This cannot be undone.'
            )
        ).not.toBeNull();
        expect(
            screen.getByRole('button', { name: 'Confirm delete vegan version action' })
        ).toBeEnabled();
    });

    it('should archive an original recipe from EditRecipe, redirect home, and remove it without refresh', async () => {
        renderPage(
            routes,
            [
                ...mocksMinimal,
                mockGetRecipeWithVeganVersion,
                mockGetRecipeTwo,
                mockGetRecipeThree,
                mockArchiveRecipeOne,
                mockGetRecipesAfterArchiveRecipeOne,
            ],
            [`${PATH.ROOT}/edit/recipe/mock-recipe-one`]
        );
        const user = userEvent.setup();

        await screen.findByText('Mock Recipe');
        await user.click(await screen.findByRole('button', { name: 'Archive recipe' }));
        await user.click(await screen.findByRole('button', { name: 'Confirm archive action' }));

        expect(await screen.findByText('Recipe archived')).not.toBeNull();
        expect(await screen.findByText('Recipes')).not.toBeNull();
        expect(screen.queryByLabelText('View Mock Recipe')).toBeNull();
        expect(screen.queryAllByLabelText(/^View /)).toHaveLength(
            mockGetRecipesAfterArchiveRecipeOne.result.data.recipeMany.length
        );
    });

    it('should delete a vegan version from EditRecipe, redirect home, and clear linked vegan state without refresh', async () => {
        renderPage(
            routes,
            [
                ...mocksMinimal,
                mockGetRecipeVeganCopy,
                mockGetRecipeTwo,
                mockGetRecipeThree,
                mockDeleteRecipeVeganCopy,
                mockGetRecipesAfterDeleteVeganVersion,
            ],
            [`${PATH.ROOT}/edit/recipe/mock-recipe-one-vegan`]
        );
        const user = userEvent.setup();

        await screen.findByText('Mock Recipe');
        await user.click(await screen.findByRole('button', { name: 'Delete vegan version' }));
        await user.click(
            await screen.findByRole('button', { name: 'Confirm delete vegan version action' })
        );

        expect(await screen.findByText('Vegan version deleted')).not.toBeNull();
        expect(screen.queryByText('Error: undefined')).toBeNull();
        expect(await screen.findByText('Recipes')).not.toBeNull();
        expect(screen.queryAllByLabelText('View Mock Recipe')).toHaveLength(1);
        expect(screen.queryByText('vegan version available')).toBeNull();
        expect(screen.queryAllByLabelText(/^View /)).toHaveLength(
            mockGetRecipesAfterDeleteVeganVersion.result.data.recipeMany.length
        );
    });

    it('should clear the vegan version tag from the original recipe after deleting the vegan copy, relying on cache.modify not a fresh network response', async () => {
        // Start at home so GET_RECIPES is fetched and cached before deletion.
        // This reproduces the real user flow: home → edit vegan copy → delete → home.
        // Without a second GET_RECIPES mock, only cache.modify can update the cached data.
        const mockGetRecipesWithVeganTag = {
            request: mockGetRecipes.request,
            result: {
                data: {
                    __typename: 'Query' as const,
                    recipeMany: [
                        {
                            ...mockRecipeWithVeganVersion,
                            calculatedTags: ['vegetarian', ReservedTags.VeganVersionAvailable],
                        },
                        mockRecipeFive,
                        mockRecipeThree,
                        mockRecipeFour,
                    ],
                    recipeCount: 4,
                },
            },
        };

        const { router } = renderPage(
            routes,
            [
                ...mocksMinimal,
                mockGetRecipesWithVeganTag,
                mockGetRecipeVeganCopy,
                mockGetRecipeTwo,
                mockGetRecipeThree,
                mockDeleteRecipeVeganCopy,
                // No second mockGetRecipes — relying on cache.modify to clear the tag.
            ],
            [PATH.ROOT]
        );
        const user = userEvent.setup();

        // Confirm home loaded and the vegan tag is visible on the original recipe card.
        expect(await screen.findByText('vegan version available')).not.toBeNull();

        // Navigate programmatically to the vegan copy edit page.
        // (The vegan copy does not appear on the home page, so we cannot click through.)
        await act(async () => {
            await router.navigate(`${PATH.ROOT}/edit/recipe/mock-recipe-one-vegan`);
        });

        // Wait for edit page to load and click delete.
        const deleteBtn = await screen.findByRole('button', { name: 'Delete vegan version' });
        await user.click(deleteBtn);
        await user.click(
            await screen.findByRole('button', { name: 'Confirm delete vegan version action' })
        );

        // Verify redirect to home.
        expect(await screen.findByText('Vegan version deleted')).not.toBeNull();
        expect(await screen.findByText('Recipes')).not.toBeNull();

        // The "vegan version available" tag must be gone — cleared by cache.modify.
        expect(screen.queryByText('vegan version available')).toBeNull();

        // The original recipe card should still be present (vegan copy never appeared on home).
        expect(screen.queryAllByLabelText(/^View /)).toHaveLength(4);
    });

    it('should clear the vegan version tag even when the server returns stale data on the subsequent GET_RECIPES re-fetch', async () => {
        // Regression guard for the cache.modify-before-evict ordering in
        // deleteVeganRecipeCache.  A second GET_RECIPES mock is provided with stale
        // data (still containing vegan_version_available).  In normal operation the
        // RecipeCardsContainer is unmounted during deletion, so no active watcher
        // triggers a re-fetch and the stale mock is never consumed.  But if Apollo ever
        // does re-fetch GET_RECIPES (e.g. because of a dangling veganVersion reference),
        // the stale response would land AFTER cache.modify and overwrite the cleared tag,
        // causing the test to fail.  The fix is to run cache.modify BEFORE cache.evict so
        // the original recipe's veganVersion is null before the eviction, preventing any
        // dangling reference from appearing even transiently.
        const mockGetRecipesWithVeganTag = {
            request: mockGetRecipes.request,
            result: {
                data: {
                    __typename: 'Query' as const,
                    recipeMany: [
                        {
                            ...mockRecipeWithVeganVersion,
                            calculatedTags: ['vegetarian', ReservedTags.VeganVersionAvailable],
                        },
                        mockRecipeFive,
                        mockRecipeThree,
                        mockRecipeFour,
                    ],
                    recipeCount: 4,
                },
            },
        };

        // Stale server response — still has vegan_version_available.
        // This mock will be consumed by Apollo's cache-miss re-fetch if the bug is present.
        const mockGetRecipesStaleVeganTag = {
            request: mockGetRecipes.request,
            result: mockGetRecipesWithVeganTag.result,
        };

        const { router } = renderPage(
            routes,
            [
                ...mocksMinimal,
                mockGetRecipesWithVeganTag,
                mockGetRecipeVeganCopy,
                mockGetRecipeTwo,
                mockGetRecipeThree,
                mockDeleteRecipeVeganCopy,
                // Second GET_RECIPES mock simulates a successful server re-fetch that returns
                // the original recipe still tagged with vegan_version_available.
                mockGetRecipesStaleVeganTag,
            ],
            [PATH.ROOT]
        );
        const user = userEvent.setup();

        // Confirm home loaded and the vegan tag is visible on the original recipe card.
        expect(await screen.findByText('vegan version available')).not.toBeNull();

        // Navigate programmatically to the vegan copy edit page.
        await act(async () => {
            await router.navigate(`${PATH.ROOT}/edit/recipe/mock-recipe-one-vegan`);
        });

        // Delete the vegan copy.
        const deleteBtn = await screen.findByRole('button', { name: 'Delete vegan version' });
        await user.click(deleteBtn);
        await user.click(
            await screen.findByRole('button', { name: 'Confirm delete vegan version action' })
        );

        // Wait for redirect to home.
        expect(await screen.findByText('Vegan version deleted')).not.toBeNull();
        expect(await screen.findByText('Recipes')).not.toBeNull();

        // The "vegan version available" tag must be gone even if the server re-fetches
        // GET_RECIPES and returns stale data.
        expect(screen.queryByText('vegan version available')).toBeNull();
    });
});
