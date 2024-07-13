import { ChakraProvider } from '@chakra-ui/react';
import { RouterProvider } from 'react-router-dom';
import userEvent from '@testing-library/user-event';
import { MockedProvider } from '@apollo/client/testing';
import { afterEach, describe, expect, it } from 'vitest';
import { loadDevMessages, loadErrorMessages } from '@apollo/client/dev';
import { cleanup, getDefaultNormalizer, render, screen } from '@testing-library/react';
import { Route, createBrowserRouter, createRoutesFromElements } from 'react-router-dom';

import { useIngredientList } from '@recipe/features/recipeIngredient';
import { mockGetUnits } from '@recipe/graphql/queries/__mocks__/unit';
import { mockCreateUnit } from '@recipe/graphql/mutations/__mocks__/unit';
import { mockGetPrepMethods } from '@recipe/graphql/queries/__mocks__/prepMethod';
import { mockCreatePrepMethod } from '@recipe/graphql/mutations/__mocks__/prepMethod';
import { mockCreateIngredient } from '@recipe/graphql/mutations/__mocks__/ingredient';
import { mockGetUnitConversions } from '@recipe/graphql/queries/__mocks__/unitConversion';
import { mockGetIngredientsWithRecipe } from '@recipe/graphql/queries/__mocks__/ingredient';

import { EditableIngredientList } from '../EditableIngredientList';

loadErrorMessages();
loadDevMessages();

const MockCreateRecipe = () => {
    const props = useIngredientList();
    return <EditableIngredientList {...props} />;
};

const routes = createBrowserRouter(
    createRoutesFromElements(<Route path='/' element={<MockCreateRecipe />} />)
);

const renderComponent = () => {
    // Multiple mocks of the same query are needed due to refetch calls
    render(
        <MockedProvider
            mocks={[
                mockGetUnits,
                mockGetUnits,
                mockGetIngredientsWithRecipe,
                mockGetIngredientsWithRecipe,
                mockGetPrepMethods,
                mockGetPrepMethods,
                mockCreateUnit,
                mockCreateIngredient,
                mockCreatePrepMethod,
                mockGetUnitConversions,
            ]}
        >
            <ChakraProvider>
                <RouterProvider router={routes} />
            </ChakraProvider>
        </MockedProvider>
    );
};

describe('Unit conversion', () => {
    afterEach(() => {
        cleanup();
    });

    it('should convert to grams when below 1 kg after unit clicked', async () => {
        const user = userEvent.setup();
        // Render
        renderComponent();

        // Act
        await user.click(screen.getByText('Enter ingredient'));
        await user.keyboard('{0}{.}{5}{ }');
        await user.click(screen.getByText('kilograms'));

        // Expect
        expect(
            screen.queryByText('500g ', { normalizer: getDefaultNormalizer({ trim: false }) })
        ).not.toBeNull();
    });

    it('should convert to grams when below 1kg after unit typed', async () => {
        const user = userEvent.setup();
        // Render
        renderComponent();

        // Act
        await user.click(screen.getByText('Enter ingredient'));
        await user.keyboard('{0}{.}{5}{ }');
        await user.keyboard('{k}{g}{ }');

        // Expect
        expect(
            screen.queryByText('500g ', { normalizer: getDefaultNormalizer({ trim: false }) })
        ).not.toBeNull();
    });

    it('should show grams when below 1 kg in finished ingredient', async () => {
        const user = userEvent.setup();
        // Render
        renderComponent();

        // Act
        await user.click(screen.getByText('Enter ingredient'));
        await user.keyboard('{0}{.}{5}{ }');
        await user.click(screen.getByText('kilograms'));
        await user.click(screen.getByText('chicken'));
        await user.click(screen.getByText('chopped'));

        // Expect
        expect(screen.queryByText('500g chicken, chopped')).not.toBeNull();
        expect(screen.queryByText('Enter ingredient')).not.toBeNull();
    });
});
