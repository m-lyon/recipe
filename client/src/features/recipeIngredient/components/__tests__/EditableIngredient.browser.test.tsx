import { Route } from 'react-router-dom';
import { cleanup } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { afterEach, describe, expect, it } from 'vitest';
import { createRoutesFromElements } from 'react-router-dom';
import { loadDevMessages, loadErrorMessages } from '@apollo/client/dev';

import { renderBrowserPage } from '@recipe/utils/browserTests';
import { mockGetIngredientComponents } from '@recipe/graphql/queries/__mocks__/recipe';
import { mockGetUnitConversions } from '@recipe/graphql/queries/__mocks__/unitConversion';

import { EditableIngredient } from '../EditableIngredient';

loadErrorMessages();
loadDevMessages();

describe('Dropdown Action Keyboard', () => {
    afterEach(() => {
        cleanup();
    });
    it('should move down correctly in overflowed dropdown when cursor highlights', async () => {
        const user = userEvent.setup();
        // Render
        const screen = renderBrowserPage(
            createRoutesFromElements(
                <Route path='/' element={<EditableIngredient section={0} />} />
            ),
            [mockGetIngredientComponents, mockGetUnitConversions]
        );

        // Act
        await screen.getByText('Enter ingredient').click();
        await user.keyboard('{1}{ }');
        await screen.getByLabelText('gram', { exact: true }).hover();
        await user.keyboard('{ArrowDown>5/}');
        await new Promise((resolve) => setTimeout(resolve, 300));

        // Expect
        await expect.element(screen.getByLabelText('Highlighted selection: large')).toBeValid();
    });
});
