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

describe('EditableIngredient PrepMethod Keyboard', () => {
    afterEach(() => {
        cleanup();
    });
    it('should reset via escape key', async () => {
        const user = userEvent.setup();
        // Render
        renderComponent();

        // Act
        const ingredientInput = screen.getByText('Enter ingredient');
        await user.click(ingredientInput);
        await user.keyboard('{1}{ }{ArrowDown}{ArrowDown}{Enter}');
        await user.keyboard('{ArrowDown}{Enter}');
        await user.keyboard('{Escape}');

        // Expect
        expect(screen.queryByText('Enter ingredient')).not.toBeNull();
    });
    it('should display skip prepMethod', async () => {
        const user = userEvent.setup();
        // Render
        renderComponent();

        // Act
        const ingredientInput = screen.getByText('Enter ingredient');
        await user.click(ingredientInput);
        await user.keyboard('{1}{ }{ArrowDown}{Enter}');
        await user.keyboard('{ArrowDown}{ArrowDown}{Enter}');

        // Expect
        expect(screen.queryByText('1 cup chicken,')).not.toBeNull();
        expect(screen.queryByText('skip prep method')).not.toBeNull();
    });
    it('should display all prepMethod options', async () => {
        const user = userEvent.setup();
        // Render
        renderComponent();

        // Act
        const ingredientInput = screen.getByText('Enter ingredient');
        await user.click(ingredientInput);
        await user.keyboard('{1}{ }{ArrowDown}{ArrowDown}{Enter}');
        await user.keyboard('{ArrowDown}{Enter}');

        // Expect
        expect(screen.queryByText('chopped')).not.toBeNull();
        expect(screen.queryByText('diced')).not.toBeNull();
        expect(screen.queryByText('sliced')).not.toBeNull();
        expect(screen.queryByText('whole')).not.toBeNull();
    });
    it('should display add new prepMethod', async () => {
        const user = userEvent.setup();
        // Render
        renderComponent();

        // Act
        const ingredientInput = screen.getByText('Enter ingredient');
        await user.click(ingredientInput);
        await user.keyboard('{1}{ }{ArrowDown}{ArrowDown}{Enter}');
        await user.keyboard('{ArrowDown}{Enter}');
        await user.keyboard('{c}{h}{i}');

        // Expect
        expect(screen.queryByText('add new prep method')).not.toBeNull();
    });
    it('should display an error for a numeric character', async () => {
        const user = userEvent.setup();
        // Render
        renderComponent();

        // Act
        const ingredientInput = screen.getByText('Enter ingredient');
        await user.click(ingredientInput);
        await user.keyboard('{1}{ }{ArrowDown}{ArrowDown}{Enter}');
        await user.keyboard('{ArrowDown}{Enter}');
        await user.keyboard('{1}');

        // Expect
        expect(screen.queryByText('Invalid input')).not.toBeNull();
    });
    it('should skip prepMethod', async () => {
        const user = userEvent.setup();
        // Render
        renderComponent();

        // Act
        const quantityInput = screen.getByText('Enter ingredient');
        await user.click(quantityInput);
        await user.keyboard('{1}{ }{ArrowDown}{Enter}');
        await user.keyboard('{ArrowDown}{ArrowDown}{Enter}');
        await user.click(screen.getByText('skip prep method'));

        // Expect
        expect(screen.queryByText('1 cup chicken')).not.toBeNull();
        expect(screen.queryByText('Enter ingredient')).not.toBeNull();
    });
    it('should open up the new prepMethod popover', async () => {
        const user = userEvent.setup();
        // Render
        renderComponent();

        // Act
        const quantityInput = screen.getByText('Enter ingredient');
        await user.click(quantityInput);
        await user.keyboard('{1}{ }{ArrowDown}{ArrowDown}{Enter}');
        await user.keyboard('{ArrowDown}{Enter}');
        await user.keyboard('{c}{h}{i}');
        await user.keyboard('{ArrowDown}{Enter}');

        // Expect
        expect(screen.queryByText('Add new prep method')).not.toBeNull();
        expect(screen.queryByText('Save')).not.toBeNull();
    });
});
describe('EditableIngredient PrepMethod Click', () => {
    afterEach(() => {
        cleanup();
    });
    it('should reset via click away', async () => {
        const user = userEvent.setup();
        // Render
        renderComponent();

        // Act
        const quantityInput = screen.getByText('Enter ingredient');
        await user.click(quantityInput);
        await user.keyboard('{1}{ }');
        await user.click(screen.getByText('cup'));
        await user.click(screen.getByText('chicken'));
        await user.keyboard('{c}{h}');
        await user.click(document.body);

        // Expect
        expect(screen.queryByText('Enter ingredient')).not.toBeNull();
    });
    it('should skip prepMethod', async () => {
        const user = userEvent.setup();
        // Render
        renderComponent();

        // Act
        const quantityInput = screen.getByText('Enter ingredient');

        await user.click(quantityInput);
        await user.keyboard('{1}{ }');
        await user.click(screen.getByText('cup'));
        await user.keyboard('{c}{h}');
        await user.click(screen.getByText('chicken'));
        await user.click(screen.getByText('skip prep method'));

        // Expect
        expect(screen.queryByText('1 cup chicken')).not.toBeNull();
    });
    it('should open up the new prepMethod popover', async () => {
        const user = userEvent.setup();
        // Render
        renderComponent();

        // Act
        const quantityInput = screen.getByText('Enter ingredient');

        await user.click(quantityInput);
        await user.keyboard('{1}{ }');
        await user.click(screen.getByText('cup'));
        await user.keyboard('{c}{h}');
        await user.click(screen.getByText('chicken'));
        await user.keyboard('{c}{h}{i}');
        await user.click(screen.getByText('add new prep method'));

        // Expect
        expect(screen.queryByText('1 cup chicken, chi')).not.toBeNull();
        expect(screen.queryByText('Add new prep method')).not.toBeNull();
        expect(screen.queryByText('Save')).not.toBeNull();
    });
});
