import { userEvent } from '@testing-library/user-event';
import { cleanup, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { loadDevMessages, loadErrorMessages } from '@apollo/client/dev';

import { mockCreateRecipe } from '@recipe/graphql/mutations/__mocks__/recipe';
import { clickFindByText, enterCreateNewRecipePage } from '@recipe/utils/tests';
import { mockGetRatingsNewRecipe } from '@recipe/graphql/queries/__mocks__/rating';
import { mockAddRatingNewRecipe } from '@recipe/graphql/mutations/__mocks__/rating';
import { mockCreateRecipeAsIngr } from '@recipe/graphql/mutations/__mocks__/recipe';
import { mockGetRatingsNewRecipeAsIngr } from '@recipe/graphql/queries/__mocks__/rating';
import { enterEditRecipePage, enterViewRecipePage, notNullByText } from '@recipe/utils/tests';
import { mockImageFileNew, mockUploadImagesNew } from '@recipe/graphql/mutations/__mocks__/image';
import { mockGetRecipeNew, mockGetRecipeNewAsIngr } from '@recipe/graphql/queries/__mocks__/recipe';

import { renderComponent } from './utils';

vi.mock('global', () => ({
    fetch: vi.fn(),
}));

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
        renderComponent([mockCreateRecipe, mockGetRecipeNew, mockGetRatingsNewRecipe]);
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
        expect(screen.queryByText('2 tsp apples, diced')).not.toBeNull();
        expect(screen.getByLabelText('Edit recipe source')).toHaveProperty(
            'value',
            'Recipe Source'
        );
    });

    it('should create a recipe with an image and rating', async () => {
        // Render -----------------------------------------------
        const mockBlob = new Blob(['dummy image data'], { type: 'image/jpeg' });
        global.fetch = vi.fn().mockResolvedValue({ blob: () => Promise.resolve(mockBlob) });
        renderComponent([
            mockCreateRecipe,
            mockGetRatingsNewRecipe,
            mockUploadImagesNew,
            mockAddRatingNewRecipe,
            mockGetRecipeNew,
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
        await user.click(starContainer! satisfies Element as Element);
        // --- Save Recipe ---------------------------------------
        await user.click(screen.getByLabelText('Save recipe'));

        // Expect ------------------------------------------------
        // ------ Home Page --------------------------------------
        await notNullByText(screen, 'Recipes', 'New Recipe', 'freezable');
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
        expect(screen.queryByText('2 tsp apples, diced')).not.toBeNull();
        expect(screen.queryByAltText('test_image_new.png')).not.toBeNull();
        expect(screen.getByRole('rating').querySelector('.filled-icons')).toHaveProperty(
            'title',
            '1.5 out of 5'
        );
    });

    it('should create a recipe as an ingredient', async () => {
        // Render -----------------------------------------------
        renderComponent([
            mockCreateRecipeAsIngr,
            mockGetRecipeNewAsIngr,
            mockGetRatingsNewRecipeAsIngr,
        ]);
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

        // ------ Edit Recipe Page -------------------------------
        await enterEditRecipePage(screen, user, 'New Ingredient Recipe', 'Instr #1.');
        await notNullByText(screen, 'Instr #2.', '2 tsp apples, diced');

        // ------ Ingredients List ------------------------------
        await user.click(screen.getAllByLabelText('Create new recipe')[0]);
        expect(await screen.findByText('Enter Recipe Title')).not.toBeNull();
        await user.click(screen.getByLabelText('Enter ingredient #1 for subsection 1'));
        await user.keyboard('{2}{ }');
        await user.click(await screen.findByText('skip unit'));
        expect(screen.queryByText('new ingredient recipes')).not.toBeNull();
    });
});
