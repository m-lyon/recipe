import { userEvent } from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, screen, waitFor } from '@testing-library/react';
import { loadDevMessages, loadErrorMessages } from '@apollo/client/dev';
import createFetchMock from 'vitest-fetch-mock';

import { PATH } from '@recipe/constants';
import { ReservedTags } from '@recipe/graphql/enums';
import { getMockedImageBlob } from '@recipe/utils/tests';
import { enterEditRecipePage } from '@recipe/utils/tests';
import { enterViewRecipePage } from '@recipe/utils/tests';
import { enterCreateNewRecipePage } from '@recipe/utils/tests';
import { MockedResponses, renderPage } from '@recipe/utils/tests';
import { GET_RECIPE, GET_RECIPES } from '@recipe/graphql/queries/recipe';
import { mockRecipeOne } from '@recipe/graphql/queries/__mocks__/recipe';
import { mockGetRecipes } from '@recipe/graphql/queries/__mocks__/recipe';
import { mockGetRenamedRecipe } from '@recipe/graphql/queries/__mocks__/recipe';
import { mockUpdateRecipeTwo } from '@recipe/graphql/mutations/__mocks__/recipe';
import { mockRecipeThreeVeganCopy } from '@recipe/graphql/queries/__mocks__/recipe';
import { mockArchiveRecipeThree } from '@recipe/graphql/mutations/__mocks__/recipe';
import { mockRecipeWithVeganVersion } from '@recipe/graphql/queries/__mocks__/recipe';
import { mockCreateVeganRecipeTwo } from '@recipe/graphql/mutations/__mocks__/recipe';
import { mockGetRecipeThreeVeganCopy } from '@recipe/graphql/queries/__mocks__/recipe';
import { mockUploadImagesTwoVeganCopy } from '@recipe/graphql/mutations/__mocks__/image';
import { mockGetRecipeWithVeganVersion } from '@recipe/graphql/queries/__mocks__/recipe';
import { mockUpdateRecipeOneNoChange } from '@recipe/graphql/mutations/__mocks__/recipe';
import { mockGetRecipesWithVeganVersion } from '@recipe/graphql/queries/__mocks__/recipe';
import { mockUpdateRecipeThreeNoChange } from '@recipe/graphql/mutations/__mocks__/recipe';
import { mockDeleteRecipeThreeVeganCopy } from '@recipe/graphql/mutations/__mocks__/recipe';
import { mockUpdateRecipeThreeWithRename } from '@recipe/graphql/mutations/__mocks__/recipe';
import { mockCreateVeganRecipeViaMutation } from '@recipe/graphql/mutations/__mocks__/recipe';
import { mockGetRecipeThree, mockGetRecipeTwo } from '@recipe/graphql/queries/__mocks__/recipe';
import { mockGetRecipesAfterArchiveRecipeThree } from '@recipe/graphql/queries/__mocks__/recipe';
import { mockUpdateRecipeThreeVeganCopyNoChange } from '@recipe/graphql/mutations/__mocks__/recipe';
import { mockUpdateRecipeWithVeganVersionNoChange } from '@recipe/graphql/mutations/__mocks__/recipe';
import { mockUpdateRecipeWithVeganVersionBecomeVegan } from '@recipe/graphql/mutations/__mocks__/recipe';

import { routes } from '../routes';
import { renderComponent } from './utils';
import { mocks, mocksMinimal } from '../__mocks__/graphql';

const fetchMocker = createFetchMock(vi);
fetchMocker.enableMocks();

loadErrorMessages();
loadDevMessages();

/** Helper: render the app using mocksMinimal + a specific GET_RECIPE mock for mock-recipe-one */
function renderWithRecipeMock(...extraMocks: MockedResponses) {
    return renderPage(routes, [...mocksMinimal, ...extraMocks], [PATH.ROOT]);
}

describe('EditRecipe - Vegan Version Checkbox Visibility', () => {
    afterEach(() => {
        cleanup();
    });

    it('should show the vegan version checkbox for a normal recipe without a vegan version', async () => {
        // mockRecipeOne has veganVersion: null and originalRecipe: null
        renderComponent();
        const user = userEvent.setup();

        await enterEditRecipePage(screen, user, 'Mock Recipe', 'Instruction one.');

        expect(await screen.findByLabelText('Create vegan version of this recipe')).not.toBeNull();
    });

    it('should show a pre-checked "Edit vegan version" checkbox when recipe has a vegan version', async () => {
        renderWithRecipeMock(mockGetRecipeWithVeganVersion, mockGetRecipesWithVeganVersion);
        const user = userEvent.setup();

        await enterEditRecipePage(screen, user, 'Mock Recipe Three', 'Instruction one.');

        const checkbox = await screen.findByLabelText('Edit vegan version of this recipe');
        expect(checkbox).not.toBeNull();
        await waitFor(() => expect((checkbox as HTMLInputElement).checked).toBe(true));
    });

    it('should allow unchecking the "Edit vegan version" checkbox', async () => {
        renderWithRecipeMock(mockGetRecipeWithVeganVersion, mockGetRecipesWithVeganVersion);
        const user = userEvent.setup();

        await enterEditRecipePage(screen, user, 'Mock Recipe Three', 'Instruction one.');

        const checkbox = await screen.findByLabelText('Edit vegan version of this recipe');
        await user.click(checkbox);
        await waitFor(() => expect((checkbox as HTMLInputElement).checked).toBe(false));
    });

    it('should not show the "Create vegan version" label when the recipe already has a vegan version', async () => {
        renderWithRecipeMock(mockGetRecipeWithVeganVersion, mockGetRecipesWithVeganVersion);
        const user = userEvent.setup();

        await enterEditRecipePage(screen, user, 'Mock Recipe Three', 'Instruction one.');

        expect(screen.queryByLabelText('Create vegan version of this recipe')).toBeNull();
    });

    it('should hide the vegan version checkbox when the recipe is itself a vegan copy', async () => {
        // Construct a mock that serves a vegan copy (originalRecipe set) for the
        // standard mock-recipe-one query, so the edit page loads with originalRecipe set.

        const mockGetVeganCopyAtRecipeOne = {
            request: {
                query: GET_RECIPE,
                variables: { filter: { titleIdentifier: 'mock-recipe-three' } },
            },
            result: {
                data: { __typename: 'Query', recipeOne: mockRecipeThreeVeganCopy },
            },
        };
        renderWithRecipeMock(mockGetVeganCopyAtRecipeOne, mockGetRecipesWithVeganVersion);
        const user = userEvent.setup();

        await enterEditRecipePage(screen, user, 'Mock Recipe Three', 'Instruction one.');

        expect(screen.queryByLabelText('Create vegan version of this recipe')).toBeNull();
    });
});

describe('EditRecipe - Already Vegan Guard', () => {
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

describe('EditRecipe - Vegan Original Guard', () => {
    afterEach(() => {
        cleanup();
    });

    it('should show a warning toast when an original recipe with a linked vegan version is saved as vegan', async () => {
        renderWithRecipeMock(
            mockGetRecipeWithVeganVersion,
            mockGetRecipesWithVeganVersion,
            mockUpdateRecipeWithVeganVersionBecomeVegan
        );
        const user = userEvent.setup();

        await enterEditRecipePage(screen, user, 'Mock Recipe Three', 'Instruction one.');

        await user.click(screen.getByLabelText('Save recipe'));

        expect(await screen.findByText('Recipe already has linked vegan version')).not.toBeNull();
    });
});

describe('ViewRecipe - vegan copy title', () => {
    afterEach(() => {
        cleanup();
    });

    it('should not append (Vegan) to the title of a vegan copy', async () => {
        renderPage(
            routes,
            [...mocks, mockGetRecipeThreeVeganCopy],
            [`${PATH.ROOT}/view/recipe/mock-recipe-three-vegan`]
        );
        expect(await screen.findByText('Mock Recipe Three')).not.toBeNull();
        expect(screen.queryByText('Mock Recipe Three (Vegan)')).toBeNull();
    });
});

describe('ViewRecipe - linked vegan navigation action', () => {
    afterEach(() => {
        cleanup();
    });

    it('should show a plant icon action on an original recipe with a vegan version', async () => {
        renderPage(
            routes,
            [...mocksMinimal, mockGetRecipeWithVeganVersion],
            [`${PATH.ROOT}/view/recipe/mock-recipe-three`]
        );

        expect(await screen.findByText('Mock Recipe Three')).not.toBeNull();
        expect(await screen.findByLabelText('View vegan version')).not.toBeNull();
        expect(screen.queryByText('View Vegan Version')).toBeNull();
    });

    it('should show a meat icon action on a vegan copy with an original recipe', async () => {
        renderPage(
            routes,
            [...mocksMinimal, mockGetRecipeThreeVeganCopy],
            [`${PATH.ROOT}/view/recipe/mock-recipe-three-vegan`]
        );

        expect(await screen.findByText('Mock Recipe Three')).not.toBeNull();
        expect(await screen.findByLabelText('View original recipe')).not.toBeNull();
        expect(screen.queryByText('View Original Recipe')).toBeNull();
    });

    it('should navigate to the linked recipe when the icon action is clicked', async () => {
        renderPage(
            routes,
            [...mocksMinimal, mockGetRecipeWithVeganVersion, mockGetRecipeThreeVeganCopy],
            [`${PATH.ROOT}/view/recipe/mock-recipe-three`]
        );
        const user = userEvent.setup();

        await screen.findByText('Mock Recipe Three');
        await user.click(await screen.findByLabelText('View vegan version'));

        await waitFor(() => {
            expect(screen.getByLabelText('View original recipe')).not.toBeNull();
        });
    });
});

describe('ViewRecipe - recipe ingredient vegan suffix', () => {
    afterEach(() => {
        cleanup();
    });

    it('renders (ve) for recipe ingredients that are vegan copies', async () => {
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
                                _id: 'mock-recipe-ingredient-vegan-copy',
                                title: 'Mock Stock',
                                pluralTitle: null,
                                originalRecipe: {
                                    __typename: 'Recipe' as const,
                                    _id: 'mock-recipe-ingredient-original',
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
            [...mocksMinimal, mockGetRecipeWithRecipeIngredient, mockGetRecipes],
            [PATH.ROOT]
        );
        const user = userEvent.setup();

        await enterViewRecipePage(screen, user, 'Mock Recipe', 'Instruction one.');

        expect((await screen.findByLabelText('View Mock Stock')).textContent).toContain(
            'mock stock (ve)'
        );
    });
});

describe('CreateVeganRecipe - Page', () => {
    afterEach(() => {
        cleanup();
    });

    it('should render the create vegan recipe page with Submit Vegan Version button', async () => {
        renderPage(routes, [...mocks], [`${PATH.ROOT}/create/recipe/vegan/mock-recipe-three`]);

        expect(await screen.findByText('Submit Vegan Version')).not.toBeNull();
    });

    it('should pre-populate the title field from the original recipe', async () => {
        renderPage(routes, [...mocks], [`${PATH.ROOT}/create/recipe/vegan/mock-recipe-three`]);

        // The title input should be pre-filled with the original recipe title
        expect(await screen.findByDisplayValue('Mock Recipe Three')).not.toBeNull();
    });

    it('pre-populates all ingredient and instruction subsections from the original recipe', async () => {
        const recipeWithMultipleSubsections = {
            ...mockRecipeOne,
            calculatedTags: [],
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
            [
                ...mocksMinimal,
                mockGetRecipeThree,
                mockCreateVeganRecipeViaMutation,
                mockGetRecipesWithVeganVersion,
            ],
            [`${PATH.ROOT}/create/recipe/vegan/mock-recipe-three`]
        );
        const user = userEvent.setup();
        await user.click(await screen.findByText('Submit Vegan Version'));
        expect(await screen.findByText('Recipes')).not.toBeNull();
    });
});

describe('CreateVeganRecipe - cache: originalRecipe on vegan copy', () => {
    afterEach(() => {
        cleanup();
    });

    it('should not show the vegan copy on the home page after creation', async () => {
        renderPage(
            routes,
            [...mocksMinimal, mockGetRecipeThree, mockCreateVeganRecipeViaMutation, mockGetRecipes],
            [`${PATH.ROOT}/create/recipe/vegan/mock-recipe-three`]
        );
        const user = userEvent.setup();
        await user.click(await screen.findByText('Submit Vegan Version'));
        // After navigation, we're on the home page.
        await screen.findByText('Recipes');
        await waitFor(() => expect(screen.queryByRole('status')).toBeNull());
        // The home page GET_RECIPES mock returns exactly 4 recipes (no vegan copy).
        // Assert that exactly those 4 recipe cards are rendered - if the vegan copy
        // were incorrectly shown, there would be an extra card.
        const cards = screen.queryAllByLabelText(/^View /);
        expect(cards).toHaveLength(mockGetRecipes.result.data.recipeMany.length);
    });
});

describe('CreateVeganRecipe - cache update after atomic create', () => {
    afterEach(() => {
        cleanup();
    });

    it('creates and links the vegan copy with one mutation', async () => {
        const { router } = renderPage(
            routes,
            [...mocksMinimal, mockGetRecipeThree, mockCreateVeganRecipeViaMutation, mockGetRecipes],
            [`${PATH.ROOT}/create/recipe/vegan/mock-recipe-three`]
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

describe('Home page - vegan tag filter includes recipes with vegan version', () => {
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

describe('CreateVeganRecipe - cache: home page after vegan creation', () => {
    afterEach(() => {
        cleanup();
    });

    it('should show only the original recipe on the home page with the vegan version available tag after creating a vegan version', async () => {
        // Start directly on the CreateVeganRecipe page. We replace the shared mockGetRecipes
        // with mockGetRecipesAfterLink so the home page shows the updated calculatedTags.
        renderPage(
            routes,
            [
                ...mocksMinimal,
                mockGetRecipeThree,
                mockCreateVeganRecipeViaMutation,
                mockGetRecipesWithVeganVersion,
            ],
            [`${PATH.ROOT}/create/recipe/vegan/mock-recipe-three`]
        );
        const user = userEvent.setup();
        await user.click(await screen.findByText('Submit Vegan Version'));

        // After navigation, we should be on the home page.
        await screen.findByText('Recipes');
        await waitFor(() => expect(screen.queryByRole('status')).toBeNull());

        // Only the original 4 recipes should be shown - the vegan copy must NOT appear.
        const cards = screen.queryAllByLabelText(/^View /);
        expect(cards).toHaveLength(mockGetRecipes.result.data.recipeMany.length);

        // The original recipe card must be present.
        expect(screen.queryAllByLabelText('View Mock Recipe Three')).toHaveLength(1);

        // The original recipe card must display the 'vegan version available' calculated tag,
        // updated via cache.modify in the createVeganRecipe update callback.
        expect(screen.getByText('vegan version available')).not.toBeNull();
        expect(screen.queryByText('vegan_version_available')).toBeNull();
    });
});

describe('EditRecipe - toast when navigating to CreateVeganRecipe', () => {
    afterEach(() => {
        cleanup();
    });

    it('should show a toast when saving a recipe with the create vegan version checkbox checked', async () => {
        // A non-vegan recipe with no existing vegan version so saving with the checkbox checked
        // triggers navigation to CreateVeganRecipe (not the warning toast).
        renderPage(
            routes,
            [...mocksMinimal, mockGetRecipeThree, mockGetRecipes, mockUpdateRecipeThreeNoChange],
            [PATH.ROOT]
        );
        const user = userEvent.setup();
        await enterEditRecipePage(screen, user, 'Mock Recipe Three', 'Instruction one.');
        await user.click(screen.getByLabelText('Create vegan version of this recipe'));
        await user.click(screen.getByLabelText('Save recipe'));
        expect(await screen.findByText('Creating vegan version')).not.toBeNull();
    });

    it('redirects vegan creation using the updated title identifier after a rename', async () => {
        const { router } = renderPage(
            routes,
            [
                ...mocksMinimal,
                mockGetRecipeThree,
                mockUpdateRecipeThreeWithRename,
                mockGetRenamedRecipe,
            ],
            [`${PATH.ROOT}/edit/recipe/mock-recipe-three`]
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
});

describe('EditRecipe - vegan checkbox stays checked after save', () => {
    afterEach(() => {
        cleanup();
    });

    it('should keep the "Edit vegan version" checkbox checked after clicking save', async () => {
        renderPage(
            routes,
            [
                ...mocksMinimal,
                mockGetRecipes,
                mockGetRecipeWithVeganVersion,
                mockUpdateRecipeWithVeganVersionNoChange,
            ],
            [PATH.ROOT]
        );
        const user = userEvent.setup();
        await enterEditRecipePage(screen, user, 'Mock Recipe Three', 'Instruction one.');

        const checkbox = await screen.findByLabelText('Edit vegan version of this recipe');
        await waitFor(() => expect((checkbox as HTMLInputElement).checked).toBe(true));

        await user.click(screen.getByLabelText('Save recipe'));

        // The toast fires, but the checkbox must still be checked during the redirect delay
        await screen.findByText('Redirecting to existing vegan version');
        expect((checkbox as HTMLInputElement).checked).toBe(true);
    });
});

describe('EditRecipe - save button enabled on vegan copy edit page after redirect', () => {
    afterEach(() => {
        cleanup();
    });

    it('should have an enabled save button after being redirected to the vegan version edit page', async () => {
        renderPage(
            routes,
            [
                ...mocksMinimal,
                mockGetRecipesWithVeganVersion,
                mockGetRecipeWithVeganVersion,
                mockUpdateRecipeWithVeganVersionNoChange,
                mockGetRecipeThreeVeganCopy,
                mockUpdateRecipeThreeVeganCopyNoChange,
            ],
            [PATH.ROOT]
        );
        const user = userEvent.setup();
        await enterEditRecipePage(screen, user, 'Mock Recipe Three', 'Instruction one.');

        // Wait for the checkbox to be pre-checked (veganVersion loaded)
        const checkbox = await screen.findByLabelText('Edit vegan version of this recipe');
        await waitFor(() => expect((checkbox as HTMLInputElement).checked).toBe(true));

        await user.click(screen.getByLabelText('Save recipe'));

        // Wait for redirect to vegan copy edit page
        await screen.findByText('Redirecting to existing vegan version');

        // Wait for navigation to the vegan copy edit page
        // The vegan copy page should load with the save button enabled
        const screenBtn = await screen.findByLabelText('Save vegan version');
        expect(screenBtn).not.toBeNull();
        expect((screenBtn as HTMLButtonElement).disabled).toBe(false);
    });
});

describe('EditRecipe - destructive action button', () => {
    afterEach(() => {
        cleanup();
    });

    it('should show Archive for an original recipe edit page and not Delete vegan version', async () => {
        renderPage(
            routes,
            [...mocksMinimal, mockGetRecipeWithVeganVersion],
            [`${PATH.ROOT}/edit/recipe/mock-recipe-three`]
        );

        expect(await screen.findByText('Mock Recipe Three')).not.toBeNull();
        expect(await screen.findByRole('button', { name: 'Archive' })).not.toBeNull();
        expect(screen.queryByRole('button', { name: 'Delete' })).toBeNull();
    });

    it('should show Delete vegan version for a vegan copy edit page and not Archive', async () => {
        renderPage(
            routes,
            [...mocksMinimal, mockGetRecipeThreeVeganCopy],
            [`${PATH.ROOT}/edit/recipe/mock-recipe-three-vegan`]
        );

        expect(await screen.findByText('Mock Recipe Three')).not.toBeNull();
        expect(await screen.findByRole('button', { name: 'Delete' })).not.toBeNull();
        expect(screen.queryByRole('button', { name: 'Archive' })).toBeNull();
    });

    it('should open action-specific confirmation modal copy for archive', async () => {
        const user = userEvent.setup();

        renderPage(
            routes,
            [...mocksMinimal, mockGetRecipeWithVeganVersion],
            [`${PATH.ROOT}/edit/recipe/mock-recipe-three`]
        );

        await screen.findByText('Mock Recipe Three');
        await user.click(await screen.findByRole('button', { name: 'Archive' }));

        expect(await screen.findByText('Archive Recipe')).not.toBeNull();
        expect(
            await screen.findByText(
                'Are you sure you want to archive this recipe? You can restore it later.'
            )
        ).not.toBeNull();
        expect(screen.getByRole('button', { name: 'Confirm archive action' })).toBeEnabled();
        await user.click(screen.getByRole('button', { name: 'Cancel archive action' }));
    });

    it('should open action-specific confirmation modal copy for delete vegan version', async () => {
        const user = userEvent.setup();

        renderPage(
            routes,
            [...mocksMinimal, mockGetRecipeThreeVeganCopy],
            [`${PATH.ROOT}/edit/recipe/mock-recipe-three-vegan`]
        );

        await screen.findByText('Mock Recipe Three');
        await user.click(await screen.findByRole('button', { name: 'Delete' }));

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
                mockArchiveRecipeThree,
                mockGetRecipesAfterArchiveRecipeThree,
            ],
            [`${PATH.ROOT}/edit/recipe/mock-recipe-three`]
        );
        const user = userEvent.setup();

        await screen.findByText('Mock Recipe Three');
        await user.click(await screen.findByRole('button', { name: 'Archive' }));
        await user.click(await screen.findByRole('button', { name: 'Confirm archive action' }));

        expect(await screen.findByText('Recipe archived')).not.toBeNull();
        expect(await screen.findByText('Recipes')).not.toBeNull();
        await waitFor(() => expect(screen.queryByRole('status')).toBeNull());
        expect(screen.queryByLabelText('View Mock Recipe Three')).toBeNull();
        expect(screen.queryAllByLabelText(/^View /)).toHaveLength(
            mockGetRecipesAfterArchiveRecipeThree.result.data.recipeMany.length
        );
    });

    it('should clear the vegan version tag from the original recipe after deleting the vegan copy, relying on cache.modify not a fresh network response', async () => {
        // Start at home so GET_RECIPES is fetched and cached before deletion.
        // This reproduces the real user flow: home → edit vegan copy → delete → home.
        // Without a second GET_RECIPES mock, only cache.modify can update the cached data.

        renderPage(
            routes,
            [
                ...mocksMinimal,
                mockGetRecipesWithVeganVersion,
                mockGetRecipeWithVeganVersion,
                mockUpdateRecipeWithVeganVersionNoChange,
                mockGetRecipeThreeVeganCopy,
                mockDeleteRecipeThreeVeganCopy,
                mockGetRecipeThreeVeganCopy, // cache.evict calls GET_RECIPE a second time it seems
            ],
            [PATH.ROOT]
        );
        const user = userEvent.setup();

        // Confirm home loaded and the vegan tag is visible on the original recipe card.
        expect(await screen.findByText('vegan version available')).not.toBeNull();
        await enterEditRecipePage(screen, user, 'Mock Recipe Three', 'Instruction one.');
        // Save button to navigate to the vegan copy edit page, where the delete button is.
        await user.click(screen.getByLabelText('Save recipe'));
        expect(await screen.findByLabelText('Save vegan version')).not.toBeNull();

        // Wait for edit page to load and click delete.
        const deleteBtn = screen.getByRole('button', { name: 'Delete' });
        await user.click(deleteBtn);
        await user.click(
            await screen.findByRole('button', { name: 'Confirm delete vegan version action' })
        );

        // Verify redirect to home.
        expect(await screen.findByText('Vegan version deleted')).not.toBeNull();
        expect(await screen.findByText('Recipes')).not.toBeNull();

        // The "vegan version available" tag must be gone - cleared by cache.modify.
        expect(screen.queryByText('vegan version available')).toBeNull();

        // The original recipe card should still be present (vegan copy never appeared on home).
        expect(screen.queryAllByLabelText(/^View /)).toHaveLength(4);
    });
});

describe('CreateVeganRecipe - ingredient dropdown after creating vegan copy of a recipe ingredient', () => {
    afterEach(() => {
        cleanup();
    });

    it('should show both the original and vegan copy in the ingredient dropdown after creating a vegan version of a recipe that is also an ingredient', async () => {
        // Build a custom mocksMinimal that replaces the default ingredient component
        // mocks with versions that include mockRecipeTwo (isIngredient: true).
        const customMocks = [
            ...mocksMinimal,
            mockGetRecipes,
            mockGetRecipeTwo, // edit page loads GET_RECIPE for mock-recipe-two
            mockUpdateRecipeTwo, // save on edit page fires UPDATE_RECIPE
            // mockGetRecipeTwo, // CreateVeganRecipe page loads GET_RECIPE again
            mockCreateVeganRecipeTwo,
            mockUploadImagesTwoVeganCopy,
        ];
        fetchMock.mockResponseOnce(getMockedImageBlob());
        renderPage(routes, customMocks, [PATH.ROOT]);
        const user = userEvent.setup();

        // Navigate to edit page for Mock Recipe Two (which is also an ingredient)
        await enterEditRecipePage(screen, user, 'Mock Recipe Two', 'Instruction one.');

        // Check the "Create vegan version" checkbox and save
        await user.click(screen.getByLabelText('Create vegan version of this recipe'));
        await user.click(screen.getByLabelText('Save recipe'));

        // Wait for the toast and navigation to the CreateVeganRecipe page
        await screen.findByText('Creating vegan version');
        expect(await screen.findByText('Submit Vegan Version')).not.toBeNull();

        // Submit the vegan version (no modifications needed – the form is pre-filled)
        await user.click(screen.getByText('Submit Vegan Version'));

        // Wait for the success toast and redirect to the home page
        await screen.findByText('Vegan version created');
        await screen.findByText('Recipes');

        // Navigate to the create new recipe page
        await enterCreateNewRecipePage(screen, user);

        // Open the ingredient input and type enough to trigger recipe suggestions
        await user.click(screen.getByLabelText('Enter ingredient #1 for subsection 1'));
        await user.keyboard('{1}{ }');
        expect(await screen.findByText('apple')).not.toBeNull();

        expect(screen.queryByText('mock recipe two')).not.toBeNull();
        expect(await screen.findByText('mock recipe two (ve)')).not.toBeNull();
    });
});
