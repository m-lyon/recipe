import { ChakraProvider } from '@chakra-ui/react';
import { RouterProvider } from 'react-router-dom';
import userEvent from '@testing-library/user-event';
import { MockedProvider } from '@apollo/client/testing';
import { afterEach, describe, expect, it } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';
import { loadDevMessages, loadErrorMessages } from '@apollo/client/dev';
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

describe('FinishedIngredient', () => {
    afterEach(() => {
        cleanup();
    });
    it('should display a completed item', async () => {
        const user = userEvent.setup();
        // Render
        renderComponent();

        // Act
        const quantityInput = screen.getByText('Enter ingredient');

        await user.click(quantityInput);
        await user.keyboard('{1}{ }');
        await user.click(screen.getByText('ounce'));
        await user.click(screen.getByText('chicken'));
        await user.click(screen.getByText('chopped'));

        // Expect
        expect(screen.queryByText('1 oz chicken, chopped')).not.toBeNull();
    });
    it('should display two completed items', async () => {
        const user = userEvent.setup();
        // Render
        renderComponent();

        // Act
        await user.click(screen.getByText('Enter ingredient'));
        await user.keyboard('{1}{ }');
        await user.click(screen.getByText('ounce'));
        await user.click(screen.getByText('chicken'));
        await user.click(screen.getByText('chopped'));

        await user.keyboard('{2}{ }');
        await user.click(screen.getByText('ounces'));
        await user.click(screen.getByText('iceberg lettuce'));
        await user.click(screen.getByText('diced'));

        // Expect
        expect(screen.queryByText('1 oz chicken, chopped')).not.toBeNull();
        expect(screen.queryByText('2 oz iceberg lettuce, diced')).not.toBeNull();
        expect(screen.queryByText('Enter ingredient')).not.toBeNull();
    });
    it('should display a completed item without a unit', async () => {
        const user = userEvent.setup();
        // Render
        renderComponent();

        // Act
        await user.click(screen.getByText('Enter ingredient'));
        await user.keyboard('{1}{ }');
        await user.click(screen.getByText('skip unit'));
        await user.click(screen.getByText('chicken'));
        await user.click(screen.getByText('chopped'));

        // Expect
        expect(screen.queryByText('1 chicken, chopped')).not.toBeNull();
        expect(screen.queryByText('Enter ingredient')).not.toBeNull();
    });
    it('should display a completed item without a prepMethod', async () => {
        const user = userEvent.setup();
        // Render
        renderComponent();

        // Act
        await user.click(screen.getByText('Enter ingredient'));
        await user.keyboard('{1}{ }');
        await user.click(screen.getByText('ounce'));
        await user.click(screen.getByText('chicken'));
        await user.click(screen.getByText('skip prep method'));

        // Expect
        expect(screen.queryByText('1 oz chicken')).not.toBeNull();
        expect(screen.queryByText('Enter ingredient')).not.toBeNull();
    });
    it('should display a completed item without a prepMethod or unit', async () => {
        const user = userEvent.setup();
        // Render
        renderComponent();

        // Act
        await user.click(screen.getByText('Enter ingredient'));
        await user.keyboard('{1}{ }');
        await user.click(screen.getByText('skip unit'));
        await user.click(screen.getByText('chicken'));
        await user.click(screen.getByText('skip prep method'));

        // Expect
        expect(screen.queryByText('1 chicken')).not.toBeNull();
        expect(screen.queryByText('Enter ingredient')).not.toBeNull();
    });
    it('should display a completed item with plural units', async () => {
        const user = userEvent.setup();
        // Render
        renderComponent();

        // Act
        await user.click(screen.getByText('Enter ingredient'));
        await user.keyboard('{2}{ }');
        await user.click(screen.getByText('cups'));
        await user.click(screen.getByText('chicken'));
        await user.click(screen.getByText('chopped'));

        // Expect
        expect(screen.queryByText('2 cups chicken, chopped')).not.toBeNull();
        expect(screen.queryByText('Enter ingredient')).not.toBeNull();
    });
    it('should display a completed item with no unit and plural ingredient', async () => {
        const user = userEvent.setup();
        // Render
        renderComponent();

        // Act
        await user.click(screen.getByText('Enter ingredient'));
        await user.keyboard('{2}{ }');
        await user.click(screen.getByText('skip unit'));
        await user.click(screen.getByText('chickens'));
        await user.click(screen.getByText('chopped'));

        // Expect
        expect(screen.queryByText('2 chickens, chopped')).not.toBeNull();
        expect(screen.queryByText('Enter ingredient')).not.toBeNull();
    });
    it('should display a completed item with no quantity or unit', async () => {
        const user = userEvent.setup();
        // Render
        renderComponent();

        // Act
        await user.click(screen.getByText('Enter ingredient'));
        await user.click(screen.getByText('skip quantity'));
        await user.click(screen.getByText('chicken'));
        await user.click(screen.getByText('chopped'));

        // Expect
        expect(screen.queryByText('chicken, chopped')).not.toBeNull();
        expect(screen.queryByText('Enter ingredient')).not.toBeNull();
    });
    it('should display a completed item with no quantity or unit from typing', async () => {
        const user = userEvent.setup();
        // Render
        renderComponent();

        // Act
        await user.click(screen.getByText('Enter ingredient'));
        await user.keyboard('{c}{h}{i}');
        await user.click(screen.getByText('chicken'));
        await user.click(screen.getByText('chopped'));

        // Expect
        expect(screen.queryByText('chicken, chopped')).not.toBeNull();
        expect(screen.queryByText('Enter ingredient')).not.toBeNull();
    });
    it('should rearrange the order of the items', async () => {}); // TODO
});
