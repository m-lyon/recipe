import createFetchMock from 'vitest-fetch-mock';
import { userEvent } from '@testing-library/user-event';
import { cleanup, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { loadDevMessages, loadErrorMessages } from '@apollo/client/dev';

import { getMockedImageBlob, nullByText } from '@recipe/utils/tests';
import { mockCreateRecipe } from '@recipe/graphql/mutations/__mocks__/recipe';
import { mockZeroLinkedNewRecipe } from '@recipe/graphql/queries/__mocks__/recipe';
import { mockAddRatingNewRecipe } from '@recipe/graphql/mutations/__mocks__/rating';
import { mockCreateRecipeAsIngr } from '@recipe/graphql/mutations/__mocks__/recipe';
import { mockGetRecipeNewWithImages } from '@recipe/graphql/queries/__mocks__/recipe';
import { enterEditRecipePage, enterViewRecipePage, notNullByText } from '@recipe/utils/tests';
import { mockImageFileNew, mockUploadImagesNew } from '@recipe/graphql/mutations/__mocks__/image';
import { clickFindByText, enterCreateNewRecipePage, notNullByLabelText } from '@recipe/utils/tests';
import { mockGetRecipeNew, mockGetRecipeNewAsIngr } from '@recipe/graphql/queries/__mocks__/recipe';

import { renderComponent } from './utils';

const fetchMocker = createFetchMock(vi);
fetchMocker.enableMocks();

loadErrorMessages();
loadDevMessages();

describe('Create Recipe Workflow', () => {
    const originalGetBoundingClientRect = window.HTMLElement.prototype.getBoundingClientRect;

    afterEach(() => {
        cleanup();
        vi.clearAllMocks();
        window.HTMLElement.prototype.getBoundingClientRect = originalGetBoundingClientRect;
    });

    it('should create a recipe only', async () => {
        // Render -----------------------------------------------
        renderComponent([mockCreateRecipe, mockGetRecipeNew]);
        const user = userEvent.setup();

        // Act --------------------------------------------------
        await enterCreateNewRecipePage(screen, user);
        // --- Add Title ----------------------------------------
        await user.click(screen.getByLabelText('Enter recipe title'));
        await user.keyboard('New Recipe');
        // --- Add Tag -------------------------------------------
        await user.click(screen.getByLabelText('Add a tag'));
        await user.click(await screen.findByText('freezable'));
        // --- Add Instructions ----------------------------------
        await user.click(screen.getByLabelText('Enter title for instruction subsection 1'));
        await user.keyboard('Instruct One');
        await user.click(screen.getByLabelText('Enter instruction #1 for subsection 1'));
        await user.keyboard('Instr #1.{Enter}Instr #2.{Enter}');
        // --- Change servings -----------------------------------
        await user.click(screen.getByLabelText('Increase serving size'));
        // --- Add Notes -----------------------------------------
        await user.click(screen.getByLabelText('Edit recipe notes'));
        await user.keyboard('Recipe Notes.');
        // --- Add Source ----------------------------------------
        await user.click(screen.getByLabelText('Edit recipe source'));
        await user.keyboard('Recipe Source');
        // --- Add Ingredients -----------------------------------
        await user.click(screen.getByLabelText('Enter ingredient #1 for subsection 1'));
        await user.keyboard('{2}{ }');
        await clickFindByText(screen, user, 'teaspoons', 'apples', 'diced');
        // --- Save Recipe ---------------------------------------
        await user.click(screen.getByLabelText('Save recipe'));

        // Expect ------------------------------------------------
        // ------ Home Page --------------------------------------
        await notNullByText(screen, 'Recipes', 'New Recipe', 'freezable');

        // ------ View Recipe Page -------------------------------
        await enterViewRecipePage(screen, user, 'New Recipe', 'Instr #1.');
        await notNullByText(screen, 'Instr #2.', '2 Servings', 'Recipe Notes.');
        await notNullByText(screen, 'Source: Recipe Source', '2 tsp apples, diced');
        expect(screen.queryAllByText('freezable')).not.toBeNull();
        await user.click(screen.getByLabelText('Navigate to home page'));

        // ------ Edit Recipe Page -------------------------------
        await enterEditRecipePage(screen, user, 'New Recipe', 'Instr #1.');
        await notNullByText(screen, 'Instr #2.', '2 Servings', 'Recipe Notes.', 'freezable');
        expect(screen.queryByLabelText('2 tsp apples, diced')).not.toBeNull();
        expect(screen.getByLabelText('Edit recipe source')).toHaveProperty(
            'value',
            'Recipe Source'
        );
        expect(screen.queryByLabelText(/Remove .*\.png|jpeg|jpg/)).toBeNull();
    });

    it('should create a recipe with an image and rating', async () => {
        // Render -----------------------------------------------
        fetchMock.mockResponseOnce(getMockedImageBlob());
        renderComponent([
            mockCreateRecipe,
            mockUploadImagesNew,
            mockAddRatingNewRecipe,
            mockGetRecipeNewWithImages,
        ]);
        const user = userEvent.setup();
        window.HTMLElement.prototype.getBoundingClientRect = () =>
            ({ width: 100, left: 0, right: 100 }) as DOMRect;
        // Act ---------------------------------------------------
        await enterCreateNewRecipePage(screen, user);
        // --- Add Title -----------------------------------------
        await user.click(screen.getByLabelText('Enter recipe title'));
        await user.keyboard('New Recipe');
        // --- Add Tag -------------------------------------------
        await user.click(screen.getByLabelText('Add a tag'));
        await user.click(await screen.findByText('freezable'));
        // --- Add Instructions ----------------------------------
        await user.click(screen.getByLabelText('Enter title for instruction subsection 1'));
        await user.keyboard('Instruct One');
        await user.click(screen.getByLabelText('Enter instruction #1 for subsection 1'));
        await user.keyboard('Instr #1.{Enter}Instr #2.{Enter}');
        // --- Change servings -----------------------------------
        await user.click(screen.getByLabelText('Increase serving size'));
        // --- Add Notes -----------------------------------------
        await user.click(screen.getByLabelText('Edit recipe notes'));
        await user.keyboard('Recipe Notes.');
        // --- Add Source ----------------------------------------
        await user.click(screen.getByLabelText('Edit recipe source'));
        await user.keyboard('Recipe Source');
        // --- Add Ingredients -----------------------------------
        await user.click(screen.getByLabelText('Enter ingredient #1 for subsection 1'));
        await user.keyboard('{2}{ }');
        await clickFindByText(screen, user, 'teaspoons', 'apples', 'diced');
        // --- Add Image -----------------------------------------
        user.upload(screen.getByLabelText('Upload image'), mockImageFileNew);
        // --- Add Rating ----------------------------------------
        const starContainer = screen.getByRole('rating').querySelector('.react-simple-star-rating');
        const svgStar = screen.getAllByLabelText('Select star rating')[3];
        await userEvent.pointer({ target: svgStar, coords: { clientX: 30 } });
        expect(starContainer).not.toBeNull();
        await user.click(starContainer! satisfies Element);
        // --- Save Recipe ---------------------------------------
        await user.click(screen.getByLabelText('Save recipe'));

        // Expect ------------------------------------------------
        // ------ Home Page --------------------------------------
        await notNullByText(screen, 'Recipes', 'New Recipe', 'freezable');
        expect(
            screen.getByLabelText('Rating for New Recipe').querySelector('.filled-icons')
        ).toHaveProperty('title', '1.5 out of 5');
        expect(screen.queryByLabelText('Loading image 1 for New Recipe')).not.toBeNull();
        // ------ View Recipe Page -------------------------------
        await enterViewRecipePage(screen, user, 'New Recipe', 'Instr #1.');
        await notNullByText(screen, 'Instr #2.', '2 Servings', 'Recipe Notes.');
        await notNullByText(screen, 'Source: Recipe Source', '2 tsp apples, diced');
        expect(screen.queryAllByText('freezable')).not.toBeNull();
        expect(screen.queryAllByAltText('Image 1 for New Recipe')).not.toBeNull();
        expect(screen.getByRole('rating').querySelector('.filled-icons')).toHaveProperty(
            'title',
            '1.5 out of 5'
        );
        await user.click(screen.getByLabelText('Navigate to home page'));

        // ------ Edit Recipe Page -------------------------------
        await enterEditRecipePage(screen, user, 'New Recipe', 'Instr #1.');
        await notNullByText(screen, 'Instr #2.', '2 Servings', 'Recipe Notes.', 'freezable');
        expect(screen.getByLabelText('Edit recipe source')).toHaveProperty(
            'value',
            'Recipe Source'
        );
        expect(screen.queryByLabelText('2 tsp apples, diced')).not.toBeNull();
        expect(screen.queryByAltText('test_image_new.png')).not.toBeNull();
        expect(screen.getByRole('rating').querySelector('.filled-icons')).toHaveProperty(
            'title',
            '1.5 out of 5'
        );
    });

    it('should reset create recipe fields when navigating to and from home', async () => {
        // Render -----------------------------------------------
        fetchMock.mockResponseOnce(getMockedImageBlob());
        renderComponent();
        const user = userEvent.setup();
        window.HTMLElement.prototype.getBoundingClientRect = () =>
            ({ width: 100, left: 0, right: 100 }) as DOMRect;
        // Act ---------------------------------------------------
        await enterCreateNewRecipePage(screen, user);
        // --- Add Title -----------------------------------------
        await user.click(screen.getByLabelText('Enter recipe title'));
        await user.keyboard('New Recipe');
        // --- Add Tag -------------------------------------------
        await user.click(screen.getByLabelText('Add a tag'));
        await user.click(await screen.findByText('freezable'));
        // --- Add Instructions ----------------------------------
        await user.click(screen.getByLabelText('Enter title for instruction subsection 1'));
        await user.keyboard('Instruct One');
        await user.click(screen.getByLabelText('Enter instruction #1 for subsection 1'));
        await user.keyboard('Instr #1.{Enter}Instr #2.{Enter}');
        // --- Change servings -----------------------------------
        await user.click(screen.getByLabelText('Increase serving size'));
        // --- Add Notes -----------------------------------------
        await user.click(screen.getByLabelText('Edit recipe notes'));
        await user.keyboard('Recipe Notes.');
        // --- Add Source ----------------------------------------
        await user.click(screen.getByLabelText('Edit recipe source'));
        await user.keyboard('Recipe Source');
        // --- Add Ingredients -----------------------------------
        await user.click(screen.getByLabelText('Enter ingredient #1 for subsection 1'));
        await user.keyboard('{2}{ }');
        await clickFindByText(screen, user, 'teaspoons', 'apples', 'diced');
        // --- Add Image -----------------------------------------
        user.upload(screen.getByLabelText('Upload image'), mockImageFileNew);
        // --- Add Rating ----------------------------------------
        const starContainer = screen.getByRole('rating').querySelector('.react-simple-star-rating');
        const svgStar = screen.getAllByLabelText('Select star rating')[3];
        await userEvent.pointer({ target: svgStar, coords: { clientX: 30 } });
        expect(starContainer).not.toBeNull();
        await user.click(starContainer! satisfies Element);
        // --- Navigate to home ----------------------------------
        await user.click(screen.getByLabelText('Navigate to home page'));
        await notNullByText(screen, 'Recipes');
        // --- Navigate back to new recipe -----------------------
        await enterCreateNewRecipePage(screen, user);

        // Expect ------------------------------------------------
        expect(screen.getByLabelText('Edit recipe source')).toHaveProperty('value', '');
        nullByText(screen, 'Instr #2.', '2 Servings', 'Recipe Notes.', 'freezable');
        expect(screen.queryByLabelText('2 tsp apples, diced')).toBeNull();
        expect(screen.queryByAltText('test_image_new.png')).toBeNull();
        expect(screen.getByRole('rating').querySelector('.filled-icons')).toHaveProperty(
            'title',
            '0 out of 5'
        );
    });

    it('should create a recipe as an ingredient', async () => {
        // Render -----------------------------------------------
        renderComponent([mockCreateRecipeAsIngr, mockGetRecipeNewAsIngr, mockZeroLinkedNewRecipe]);
        const user = userEvent.setup();

        // Act --------------------------------------------------
        await enterCreateNewRecipePage(screen, user);
        // --- Add Title ----------------------------------------
        await user.click(screen.getByLabelText('Enter recipe title'));
        await user.keyboard('New Ingredient Recipe');
        // --- Add Instructions ----------------------------------
        await user.click(screen.getByLabelText('Enter title for instruction subsection 1'));
        await user.keyboard('Instruct One');
        await user.click(screen.getByLabelText('Enter instruction #1 for subsection 1'));
        await user.keyboard('Instr #1.{Enter}Instr #2.{Enter}');
        // --- Add Ingredients -----------------------------------
        await user.click(screen.getByLabelText('Enter ingredient #1 for subsection 1'));
        await user.keyboard('{2}{ }');
        await clickFindByText(screen, user, 'teaspoons', 'apples', 'diced');
        // --- Register as ingredient ----------------------------
        await user.click(screen.getByLabelText('Toggle recipe as ingredient'));
        await user.click(screen.getByLabelText('Edit recipe plural title'));
        await user.keyboard('New Ingredient Recipes');
        // --- Save Recipe ---------------------------------------
        await user.click(screen.getByLabelText('Save recipe'));

        // // Expect ------------------------------------------------
        // ------ View Recipe Page -------------------------------
        await enterViewRecipePage(screen, user, 'New Ingredient Recipe', 'Instr #1.');
        await notNullByText(screen, 'Instr #2.', '2 tsp apples, diced');
        await user.click(screen.getByLabelText('Navigate to home page'));
        return;

        // ------ Edit Recipe Page -------------------------------
        await enterEditRecipePage(screen, user, 'New Ingredient Recipe', 'Instr #1.');
        await notNullByText(screen, 'Instr #2.');
        await notNullByLabelText(screen, '2 tsp apples, diced');

        // ------ Ingredients List ------------------------------
        await user.click(screen.getAllByLabelText('Create new recipe')[0]);
        expect(await screen.findByText('Enter Recipe Title')).not.toBeNull();
        await user.click(screen.getByLabelText('Enter ingredient #1 for subsection 1'));
        await user.keyboard('{2}{ }');
        await user.click(await screen.findByText('skip unit'));
        expect(screen.queryByText('new ingredient recipes')).not.toBeNull();
    });
});
