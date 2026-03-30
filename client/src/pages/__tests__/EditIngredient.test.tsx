import { userEvent } from '@testing-library/user-event';
import { afterEach, describe, expect, it } from 'vitest';
import { cleanup, screen, waitFor } from '@testing-library/react';
import { Route, createRoutesFromElements } from 'react-router-dom';
import { loadDevMessages, loadErrorMessages } from '@apollo/client/dev';

import { mockCurrentUserAdmin } from '@recipe/graphql/queries/__mocks__/user';
import { mockGetIngredients } from '@recipe/graphql/queries/__mocks__/ingredient';
import { mockUpdateIngredient } from '@recipe/graphql/mutations/__mocks__/ingredient';
import { mockDeleteIngredient } from '@recipe/graphql/mutations/__mocks__/ingredient';
import { MockedResponses, haveValueByLabelText, renderPage } from '@recipe/utils/tests';
import {
    mockGetNutritionalInfoByIngredientCarrot,
    mockGetNutritionalInfoByIngredientChicken,
} from '@recipe/graphql/queries/__mocks__/nutritionalInfo';

import { EditIngredient } from '../EditIngredient';

loadErrorMessages();
loadDevMessages();

const renderComponent = (mocks: MockedResponses = []) => {
    const routes = createRoutesFromElements(<Route path='/' element={<EditIngredient />} />);
    return renderPage(routes, [
        mockGetIngredients,
        mockCurrentUserAdmin,
        // UsdaLinkSection fires GET_NUTRITIONAL_INFO_BY_INGREDIENT whenever an ingredient is selected.
        // Carrot is selected twice in the test suite (once in test 1 and once in test 2/3),
        // so we need two carrot mocks. Apollo MockedProvider consumes one mock per matching request.
        mockGetNutritionalInfoByIngredientCarrot,
        mockGetNutritionalInfoByIngredientCarrot,
        mockGetNutritionalInfoByIngredientChicken,
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
        renderComponent([mockDeleteIngredient]);

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
});
