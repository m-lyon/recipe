import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it } from 'vitest';
import { cleanup, screen } from '@testing-library/react';
import { Route, createRoutesFromElements } from 'react-router-dom';
import { loadDevMessages, loadErrorMessages } from '@apollo/client/dev';

import { MockedResponses, renderPage } from '@recipe/utils/tests';
import { mockCarrotId, mockChickenId } from '@recipe/graphql/__mocks__/ids';
import { mockGetIngredients } from '@recipe/graphql/queries/__mocks__/ingredient';
import { mockUpdateIngredient } from '@recipe/graphql/mutations/__mocks__/ingredient';
import { mockDeleteIngredient } from '@recipe/graphql/mutations/__mocks__/ingredient';

import { EditIngredient } from '../EditIngredient';

loadErrorMessages();
loadDevMessages();

const renderComponent = (mocks: MockedResponses = []) => {
    const routes = createRoutesFromElements(<Route path='/' element={<EditIngredient />} />);
    renderPage(routes, [mockGetIngredients, ...mocks]);
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
        await user.selectOptions(screen.getByLabelText('Select ingredient'), mockCarrotId);
        expect(screen.getByLabelText('Plural name')).toHaveProperty('value', 'carrots');
        await user.click(screen.getByLabelText('Plural name'));
        await user.keyboard('{Backspace}z');
        await user.click(screen.getByLabelText('Save ingredient'));
        await user.selectOptions(screen.getByLabelText('Select ingredient'), mockChickenId);
        await user.selectOptions(screen.getByLabelText('Select ingredient'), mockCarrotId);

        // Expect
        expect(screen.getByLabelText('Name')).toHaveProperty('value', 'carrot');
        expect(screen.getByLabelText('Plural name')).toHaveProperty('value', 'carrotz');
    });

    it('should not save an update to an ingredient', async () => {
        // Render
        const user = userEvent.setup();
        renderComponent();

        // Act
        expect(await screen.findByText('Edit Ingredient')).not.toBeNull();
        await user.selectOptions(screen.getByLabelText('Select ingredient'), mockCarrotId);
        expect(screen.getByLabelText('Plural name')).toHaveProperty('value', 'carrots');
        await user.click(screen.getByLabelText('Plural name'));
        await user.keyboard('{Backspace}z');
        await user.selectOptions(screen.getByLabelText('Select ingredient'), mockChickenId);
        await user.selectOptions(screen.getByLabelText('Select ingredient'), mockCarrotId);

        // Expect
        expect(screen.getByLabelText('Name')).toHaveProperty('value', 'carrot');
        expect(screen.getByLabelText('Plural name')).toHaveProperty('value', 'carrots');
    });

    it('should remove an ingredient', async () => {
        // Render
        const user = userEvent.setup();
        renderComponent([mockDeleteIngredient]);

        // Act
        expect(await screen.findByText('Edit Ingredient')).not.toBeNull();
        await user.selectOptions(screen.getByLabelText('Select ingredient'), mockCarrotId);
        expect(screen.getByLabelText('Plural name')).toHaveProperty('value', 'carrots');
        await user.click(screen.getByLabelText('Delete ingredient'));
        await user.selectOptions(screen.getByLabelText('Select ingredient'), mockChickenId);

        // Expect
        expect(screen.queryByLabelText('apple')).not.toBeNull();
        expect(screen.queryByLabelText('carrot')).toBeNull();
    });
});
