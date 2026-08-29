import { userEvent } from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, screen, waitFor } from '@testing-library/react';
import { Route, createRoutesFromElements } from 'react-router-dom';
import { loadDevMessages, loadErrorMessages } from '@apollo/client/dev';

import { DEBOUNCE_TIME } from '@recipe/constants';
import { mockCurrentUserAdmin } from '@recipe/graphql/queries/__mocks__/user';
import { mockGetIngredients } from '@recipe/graphql/queries/__mocks__/ingredient';
import { mockUpdateIngredient } from '@recipe/graphql/mutations/__mocks__/ingredient';
import { mockDeleteIngredient } from '@recipe/graphql/mutations/__mocks__/ingredient';
import { MockedResponses, haveValueByLabelText, renderPage } from '@recipe/utils/tests';
import { mockUsdaSearchChickenBreast } from '@recipe/graphql/queries/__mocks__/nutritionalInfo';
import { mockGetNutritionalInfosForEditIngredient } from '@recipe/graphql/queries/__mocks__/nutritionalInfo';
import { mockGetNutritionalInfosForEditIngredientAfterCarrotDeleted } from '@recipe/graphql/queries/__mocks__/nutritionalInfo';

import { EditIngredient } from '../EditIngredient';

loadErrorMessages();
loadDevMessages();

const renderComponent = (mocks: MockedResponses = []) => {
    const routes = createRoutesFromElements(<Route path='/' element={<EditIngredient />} />);
    return renderPage(routes, [
        mockGetIngredients,
        mockCurrentUserAdmin,
        // EditIngredient prefetches nutritional info for every ingredient alongside the
        // ingredient list itself, in a single batch query.
        mockGetNutritionalInfosForEditIngredient,
        ...mocks,
    ]);
};

describe('Edit Ingredient', () => {
    afterEach(() => {
        cleanup();
    });

    it('should update an ingredient', async () => {
        // Render
        const user = userEvent.setup();
        renderComponent([mockUpdateIngredient]);

        // Act
        expect(await screen.findByText('Edit Ingredient')).not.toBeNull();
        await user.click(screen.getByLabelText('Select ingredient'));
        await user.click(await screen.findByRole('option', { name: 'carrot' }));
        await waitFor(() =>
            expect(screen.getByLabelText('Plural name')).toHaveProperty('value', 'carrots')
        );
        await user.click(screen.getByLabelText('Plural name'));
        await user.keyboard('{Backspace}z');
        await user.click(screen.getByLabelText('Save ingredient'));
        await user.click(screen.getByLabelText('Select ingredient'));
        await user.click(await screen.findByRole('option', { name: 'chicken' }));
        await user.click(screen.getByLabelText('Select ingredient'));
        await user.click(await screen.findByRole('option', { name: 'carrot' }));

        // Expect
        haveValueByLabelText(screen, 'Name', 'carrot');
        haveValueByLabelText(screen, 'Plural name', 'carrotz');
    });

    it('should not save an update to an ingredient', async () => {
        // Render
        const user = userEvent.setup();
        renderComponent();

        // Act
        expect(await screen.findByText('Edit Ingredient')).not.toBeNull();
        await user.click(screen.getByLabelText('Select ingredient'));
        await user.click(await screen.findByRole('option', { name: 'carrot' }));
        await waitFor(() =>
            expect(screen.getByLabelText('Plural name')).toHaveProperty('value', 'carrots')
        );
        await user.click(screen.getByLabelText('Plural name'));
        await user.keyboard('{Backspace}z');
        await user.click(screen.getByLabelText('Select ingredient'));
        await user.click(await screen.findByRole('option', { name: 'chicken' }));
        await user.click(screen.getByLabelText('Select ingredient'));
        await user.click(await screen.findByRole('option', { name: 'carrot' }));

        // Expect
        haveValueByLabelText(screen, 'Name', 'carrot');
        haveValueByLabelText(screen, 'Plural name', 'carrots');
    });

    it('should remove an ingredient', async () => {
        // Render
        const user = userEvent.setup();
        renderComponent([
            mockDeleteIngredient,
            mockGetNutritionalInfosForEditIngredientAfterCarrotDeleted,
        ]);

        // Act
        expect(await screen.findByText('Edit Ingredient')).not.toBeNull();
        await user.click(screen.getByLabelText('Select ingredient'));
        await user.click(await screen.findByRole('option', { name: 'carrot' }));
        await waitFor(() =>
            expect(screen.getByLabelText('Plural name')).toHaveProperty('value', 'carrots')
        );
        await user.click(screen.getByLabelText('Delete ingredient'));
        await user.click(screen.getByLabelText('Select ingredient'));
        await user.click(await screen.findByRole('option', { name: 'chicken' }));

        // Expect
        await user.click(screen.getByLabelText('Select ingredient'));
        expect(await screen.findByRole('option', { name: 'apple' })).not.toBeNull();
        expect(screen.queryByRole('option', { name: 'carrot' })).toBeNull();
        await user.click(screen.getByLabelText('Select ingredient'));
    });

    it('should reset the USDA link search and selection when switching ingredients', async () => {
        // Render
        const user = userEvent.setup();
        renderComponent([mockUsdaSearchChickenBreast]);

        // Act -- select carrot, search USDA, and select a result without linking it
        expect(await screen.findByText('Edit Ingredient')).not.toBeNull();
        await user.click(screen.getByLabelText('Select ingredient'));
        await user.click(await screen.findByRole('option', { name: 'carrot' }));
        await waitFor(() =>
            expect(screen.getByLabelText('Plural name')).toHaveProperty('value', 'carrots')
        );
        // The USDA search bar is prepopulated with the selected ingredient's name
        expect(screen.getByLabelText('Search nutritional data')).toHaveProperty('value', 'carrot');

        // Clear the prepopulated text before typing a different USDA search query.
        await user.clear(screen.getByLabelText('Search nutritional data'));
        await user.type(screen.getByLabelText('Search nutritional data'), 'chicken breast');
        // Wait for the search input's debounce to settle before searching
        await new Promise((resolve) => setTimeout(resolve, DEBOUNCE_TIME + 50));
        await user.click(screen.getByLabelText('Search USDA database'));
        await user.click(await screen.findByText('Chicken breast, cooked'));
        expect(await screen.findByLabelText('Link selected nutritional data')).not.toBeNull();

        // Act -- switch to a different ingredient without linking the selected item
        await user.click(screen.getByLabelText('Select ingredient'));
        await user.click(await screen.findByRole('option', { name: 'chicken' }));

        // Expect -- search text resets to the new ingredient's name, and the search
        // results and pending selection from the previous ingredient are cleared
        await waitFor(() =>
            expect(screen.getByLabelText('Search nutritional data')).toHaveProperty(
                'value',
                'chicken'
            )
        );
        expect(screen.queryByText('Chicken breast, cooked')).toBeNull();
        expect(screen.queryByLabelText('Link selected nutritional data')).toBeNull();
    });

    it('should search on Enter from the USDA search bar without it reaching the page-level save-on-Enter handler', async () => {
        // The ingredient form saves on Enter via a global `window` keydown listener
        // (useKeyboardSubmit) that fires for Enter anywhere inside the form. The USDA
        // search bar must stop that keydown from propagating that far, or it also saves.
        const user = userEvent.setup();
        renderComponent([mockUsdaSearchChickenBreast]);

        // Act
        expect(await screen.findByText('Edit Ingredient')).not.toBeNull();
        await user.click(screen.getByLabelText('Select ingredient'));
        await user.click(await screen.findByRole('option', { name: 'carrot' }));
        await waitFor(() =>
            expect(screen.getByLabelText('Plural name')).toHaveProperty('value', 'carrots')
        );

        const windowKeydown = vi.fn();
        window.addEventListener('keydown', windowKeydown);

        await user.clear(screen.getByLabelText('Search nutritional data'));
        await user.type(screen.getByLabelText('Search nutritional data'), 'chicken breast');
        await new Promise((resolve) => setTimeout(resolve, DEBOUNCE_TIME + 50));
        await user.type(screen.getByLabelText('Search nutritional data'), '{Enter}');

        // Expect -- Enter triggered the USDA search...
        expect(await screen.findByText('Chicken breast, cooked')).not.toBeNull();
        // ...and the Enter keydown never reached window-level listeners
        expect(windowKeydown).not.toHaveBeenCalledWith(expect.objectContaining({ key: 'Enter' }));

        window.removeEventListener('keydown', windowKeydown);
    });
});
