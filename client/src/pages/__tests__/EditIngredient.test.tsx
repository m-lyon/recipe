import { userEvent } from '@testing-library/user-event';
import { afterEach, describe, expect, it } from 'vitest';
import { cleanup, screen, waitFor } from '@testing-library/react';
import { Route, createRoutesFromElements } from 'react-router-dom';
import { loadDevMessages, loadErrorMessages } from '@apollo/client/dev';

import { mockCarrotId, mockChickenId } from '@recipe/graphql/__mocks__/ids';
import { mockCurrentUserAdmin } from '@recipe/graphql/queries/__mocks__/user';
import { mockGetIngredients } from '@recipe/graphql/queries/__mocks__/ingredient';
import { mockUpdateIngredient } from '@recipe/graphql/mutations/__mocks__/ingredient';
import { mockDeleteIngredient } from '@recipe/graphql/mutations/__mocks__/ingredient';
import { MockedResponses, haveValueByLabelText, renderPage } from '@recipe/utils/tests';

import { EditIngredient } from '../EditIngredient';

loadErrorMessages();
loadDevMessages();

const renderComponent = (mocks: MockedResponses = []) => {
    const routes = createRoutesFromElements(<Route path='/' element={<EditIngredient />} />);
    renderPage(routes, [mockGetIngredients, mockCurrentUserAdmin, ...mocks]);
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
        await waitFor(() => expect(screen.getByLabelText('carrot')).not.toBeNull());
        await user.selectOptions(screen.getByLabelText('Select ingredient'), mockCarrotId);
        expect(screen.getByLabelText('Plural name')).toHaveProperty('value', 'carrots');
        await user.click(screen.getByLabelText('Plural name'));
        await user.keyboard('{Backspace}z');
        await user.click(screen.getByLabelText('Save ingredient'));
        await user.selectOptions(screen.getByLabelText('Select ingredient'), mockChickenId);
        await user.selectOptions(screen.getByLabelText('Select ingredient'), mockCarrotId);

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
        await waitFor(() => expect(screen.getByLabelText('carrot')).not.toBeNull());
        await user.selectOptions(screen.getByLabelText('Select ingredient'), mockCarrotId);
        expect(screen.getByLabelText('Plural name')).toHaveProperty('value', 'carrots');
        await user.click(screen.getByLabelText('Plural name'));
        await user.keyboard('{Backspace}z');
        await user.selectOptions(screen.getByLabelText('Select ingredient'), mockChickenId);
        await user.selectOptions(screen.getByLabelText('Select ingredient'), mockCarrotId);

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
        await waitFor(() => expect(screen.getByLabelText('carrot')).not.toBeNull());
        await user.selectOptions(screen.getByLabelText('Select ingredient'), mockCarrotId);
        expect(screen.getByLabelText('Plural name')).toHaveProperty('value', 'carrots');
        await user.click(screen.getByLabelText('Delete ingredient'));
        await user.selectOptions(screen.getByLabelText('Select ingredient'), mockChickenId);

        // Expect
        expect(screen.queryByLabelText('apple')).not.toBeNull();
        expect(screen.queryByLabelText('carrot')).toBeNull();
    });
});
