import { userEvent } from '@testing-library/user-event';
import { afterEach, describe, expect, it } from 'vitest';
import { cleanup, screen } from '@testing-library/react';
import { Route, createRoutesFromElements } from 'react-router-dom';
import { loadDevMessages, loadErrorMessages } from '@apollo/client/dev';

import { mockGetTags } from '@recipe/graphql/queries/__mocks__/tag';
import { haveValueByLabelText, renderPage } from '@recipe/utils/tests';
import { mockCurrentUserAdmin } from '@recipe/graphql/queries/__mocks__/user';
import { mockGetIngredientComponents } from '@recipe/graphql/queries/__mocks__/recipe';
import { mockGetUnitConversions } from '@recipe/graphql/queries/__mocks__/unitConversion';

import { CreateRecipe } from '../CreateRecipe';

loadErrorMessages();
loadDevMessages();

const renderComponent = () => {
    const routes = createRoutesFromElements(<Route path='/' element={<CreateRecipe />} />);
    return renderPage(routes, [
        mockGetIngredientComponents,
        mockGetTags,
        mockGetUnitConversions,
        mockCurrentUserAdmin,
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
        const element = screen.getByLabelText('Enter recipe title');
        await user.click(element);
        await user.click(screen.getByLabelText('Enter title for ingredient subsection 1'));
        await user.click(element);
        await user.keyboard('g');

        // Expect
        haveValueByLabelText(screen, 'Enter recipe title', 'g');
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
