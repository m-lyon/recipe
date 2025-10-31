import { GraphQLError } from 'graphql';
import { userEvent } from '@testing-library/user-event';
import { afterEach, describe, expect, it } from 'vitest';
import { cleanup, screen, waitFor } from '@testing-library/react';
import { Route, createRoutesFromElements } from 'react-router-dom';
import { loadDevMessages, loadErrorMessages } from '@apollo/client/dev';

import { DELETE_UNIT } from '@recipe/graphql/mutations/unit';
import { DELETE_SIZE } from '@recipe/graphql/mutations/size';
import { MockedResponses, renderPage } from '@recipe/utils/tests';
import { mockGetUnits } from '@recipe/graphql/queries/__mocks__/unit';
import { mockGetSizes } from '@recipe/graphql/queries/__mocks__/size';
import { DeleteUnitMutationVariables } from '@recipe/graphql/generated';
import { DeleteSizeMutationVariables } from '@recipe/graphql/generated';
import { DELETE_INGREDIENT } from '@recipe/graphql/mutations/ingredient';
import { mockCarrotId, mockDicedId } from '@recipe/graphql/__mocks__/ids';
import { DELETE_PREP_METHOD } from '@recipe/graphql/mutations/prepMethod';
import { mockSmallId, mockTeaspoonId } from '@recipe/graphql/__mocks__/ids';
import { DeleteIngredientMutationVariables } from '@recipe/graphql/generated';
import { DeletePrepMethodMutationVariables } from '@recipe/graphql/generated';
import { mockCurrentUserAdmin } from '@recipe/graphql/queries/__mocks__/user';
import { mockGetIngredients } from '@recipe/graphql/queries/__mocks__/ingredient';
import { mockGetPrepMethods } from '@recipe/graphql/queries/__mocks__/prepMethod';

import { EditUnit } from '../pages/EditUnit';
import { EditSize } from '../pages/EditSize';
import { EditIngredient } from '../pages/EditIngredient';
import { EditPrepMethod } from '../pages/EditPrepMethod';

loadErrorMessages();
loadDevMessages();

// Mock GraphQL error responses for when items are in use
const mockDeleteUnitInUseError = {
    request: {
        query: DELETE_UNIT,
        variables: {
            id: mockTeaspoonId,
        } satisfies DeleteUnitMutationVariables,
    },
    error: new GraphQLError(
        'Cannot delete unit as it is currently being used in existing recipes.',
        {
            extensions: {
                code: 'ITEM_IN_USE',
            },
        }
    ),
};

const mockDeleteSizeInUseError = {
    request: {
        query: DELETE_SIZE,
        variables: {
            id: mockSmallId,
        } satisfies DeleteSizeMutationVariables,
    },
    error: new GraphQLError(
        'Cannot delete size as it is currently being used in existing recipes.',
        {
            extensions: {
                code: 'ITEM_IN_USE',
            },
        }
    ),
};

const mockDeleteIngredientInUseError = {
    request: {
        query: DELETE_INGREDIENT,
        variables: {
            id: mockCarrotId,
        } satisfies DeleteIngredientMutationVariables,
    },
    error: new GraphQLError(
        'Cannot delete ingredient as it is currently being used in existing recipes.',
        {
            extensions: {
                code: 'ITEM_IN_USE',
            },
        }
    ),
};

const mockDeletePrepMethodInUseError = {
    request: {
        query: DELETE_PREP_METHOD,
        variables: {
            id: mockDicedId,
        } satisfies DeletePrepMethodMutationVariables,
    },
    error: new GraphQLError(
        'Cannot delete prep method as it is currently being used in existing recipes.',
        {
            extensions: {
                code: 'ITEM_IN_USE',
            },
        }
    ),
};

describe('Delete Validation Toast Notifications', () => {
    afterEach(() => {
        cleanup();
    });

    const renderEditUnit = (mocks: MockedResponses = []) => {
        const routes = createRoutesFromElements(<Route path='/' element={<EditUnit />} />);
        return renderPage(routes, [mockGetUnits, mockCurrentUserAdmin, ...mocks]);
    };

    const renderEditSize = (mocks: MockedResponses = []) => {
        const routes = createRoutesFromElements(<Route path='/' element={<EditSize />} />);
        return renderPage(routes, [mockGetSizes, mockCurrentUserAdmin, ...mocks]);
    };

    const renderEditIngredient = (mocks: MockedResponses = []) => {
        const routes = createRoutesFromElements(<Route path='/' element={<EditIngredient />} />);
        return renderPage(routes, [mockGetIngredients, mockCurrentUserAdmin, ...mocks]);
    };

    const renderEditPrepMethod = (mocks: MockedResponses = []) => {
        const routes = createRoutesFromElements(<Route path='/' element={<EditPrepMethod />} />);
        return renderPage(routes, [mockGetPrepMethods, mockCurrentUserAdmin, ...mocks]);
    };

    it('should show toast notification when unit delete fails due to recipe usage', async () => {
        const user = userEvent.setup();
        renderEditUnit([mockDeleteUnitInUseError]);

        // Wait for the page to load and select the unit
        expect(await screen.findByText('Edit Unit')).not.toBeNull();
        await waitFor(() => expect(screen.getByLabelText('teaspoon')).not.toBeNull());
        await user.selectOptions(screen.getByLabelText('Select unit'), mockTeaspoonId);

        // Try to delete the unit
        await user.click(screen.getByLabelText('Delete unit'));

        // Check that a toast notification appears with the correct message
        expect(await screen.findByText('Error deleting unit')).not.toBeNull();
        expect(
            await screen.findByText(
                'Cannot delete unit as it is currently being used in existing recipes.'
            )
        ).not.toBeNull();
    });

    it('should show toast notification when size delete fails due to recipe usage', async () => {
        const user = userEvent.setup();
        renderEditSize([mockDeleteSizeInUseError]);

        // Wait for the page to load and select the size
        expect(await screen.findByText('Edit Size')).not.toBeNull();
        await waitFor(() => expect(screen.getByLabelText('small')).not.toBeNull());
        await user.selectOptions(screen.getByLabelText('Select prep method'), mockSmallId);

        // Try to delete the size
        await user.click(screen.getByLabelText('Delete size'));

        // Check that a toast notification appears with the correct message
        expect(await screen.findByText('Error deleting size')).not.toBeNull();
        expect(
            await screen.findByText(
                'Cannot delete size as it is currently being used in existing recipes.'
            )
        ).not.toBeNull();
    });

    it('should show toast notification when ingredient delete fails due to recipe usage', async () => {
        const user = userEvent.setup();
        renderEditIngredient([mockDeleteIngredientInUseError]);

        // Wait for the page to load and select the ingredient
        expect(await screen.findByText('Edit Ingredient')).not.toBeNull();
        await waitFor(() => expect(screen.getByLabelText('carrot')).not.toBeNull());
        await user.selectOptions(screen.getByLabelText('Select ingredient'), mockCarrotId);

        // Try to delete the ingredient
        await user.click(screen.getByLabelText('Delete ingredient'));

        // Check that a toast notification appears with the correct message
        expect(await screen.findByText('Error deleting ingredient')).not.toBeNull();
        expect(
            await screen.findByText(
                'Cannot delete ingredient as it is currently being used in existing recipes.'
            )
        ).not.toBeNull();
    });

    it('should show toast notification when prep method delete fails due to recipe usage', async () => {
        const user = userEvent.setup();
        renderEditPrepMethod([mockDeletePrepMethodInUseError]);

        // Wait for the page to load and select the prep method
        expect(await screen.findByText('Edit Prep Method')).not.toBeNull();
        await waitFor(() => expect(screen.getByLabelText('diced')).not.toBeNull());
        await user.selectOptions(screen.getByLabelText('Select prep method'), mockDicedId);

        // Try to delete the prep method
        await user.click(screen.getByLabelText('Delete prep method'));

        // Check that a toast notification appears with the correct message
        expect(await screen.findByText('Error deleting prep method')).not.toBeNull();
        expect(
            await screen.findByText(
                'Cannot delete prep method as it is currently being used in existing recipes.'
            )
        ).not.toBeNull();
    });
});
