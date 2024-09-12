import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it } from 'vitest';
import { cleanup, screen } from '@testing-library/react';
import { Route, createRoutesFromElements } from 'react-router-dom';
import { loadDevMessages, loadErrorMessages } from '@apollo/client/dev';

import { renderPage } from '@recipe/utils/tests';
import { mockGetTags } from '@recipe/graphql/queries/__mocks__/tag';
import { mockGetUnits } from '@recipe/graphql/queries/__mocks__/unit';
import { mockGetPrepMethods } from '@recipe/graphql/queries/__mocks__/prepMethod';
import { mockGetIngredients } from '@recipe/graphql/queries/__mocks__/ingredient';
import { mockGetUnitConversions } from '@recipe/graphql/queries/__mocks__/unitConversion';

import { CreateRecipe } from '../CreateRecipe';

loadErrorMessages();
loadDevMessages();

const renderComponent = () => {
    const routes = createRoutesFromElements(<Route path='/' element={<CreateRecipe />} />);
    renderPage(routes, [
        mockGetUnits,
        mockGetIngredients,
        mockGetPrepMethods,
        mockGetTags,
        mockGetUnitConversions,
    ]);
};

describe('Title', () => {
    afterEach(() => {
        cleanup();
    });

    it('should reset', async () => {
        // Render

        const user = userEvent.setup();
        renderComponent();

        // Act
        const element = screen.getByText('Enter Recipe Title');
        await user.click(element);
        await user.click(screen.getByLabelText('Enter title for ingredient subsection 1'));
        await user.click(element);
        await user.keyboard('g');

        // Expect
        expect(screen.queryByText('gEnter Recipe Title')).toBeNull();
        expect(screen.queryByText('g')).not.toBeNull();
    });
});

describe('Notes', () => {
    afterEach(() => {
        cleanup();
    });

    it('should reset', async () => {
        // Render
        const user = userEvent.setup();
        renderComponent();

        // Act
        const element = screen.getByPlaceholderText('Enter notes...');
        await user.click(element);
        await user.click(screen.getByLabelText('Enter title for ingredient subsection 1'));
        await user.click(element);
        await user.keyboard('g');

        // Expect
        expect(screen.queryByText('gEnter notes...')).toBeNull();
        expect(screen.queryByText('g')).not.toBeNull();
    });
});
