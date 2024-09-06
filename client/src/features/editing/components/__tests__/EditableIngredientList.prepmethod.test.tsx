import { ChakraProvider } from '@chakra-ui/react';
import { RouterProvider } from 'react-router-dom';
import userEvent from '@testing-library/user-event';
import { MockedProvider } from '@apollo/client/testing';
import { afterEach, describe, expect, it } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';
import { loadDevMessages, loadErrorMessages } from '@apollo/client/dev';
import { Route, createBrowserRouter, createRoutesFromElements } from 'react-router-dom';

import { clickGetByText, notNullByText } from '@recipe/utils/tests';
import { useIngredientList } from '@recipe/features/recipeIngredient';
import { mockGetUnits } from '@recipe/graphql/queries/__mocks__/unit';
import { mockGetPrepMethods } from '@recipe/graphql/queries/__mocks__/prepMethod';
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
    render(
        <MockedProvider
            mocks={[
                mockGetUnits,
                mockGetIngredientsWithRecipe,
                mockGetPrepMethods,
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
        await user.keyboard('{1}{ }{ArrowDown>2/}{Enter}{ArrowDown}{Enter}{Escape}');

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
        await user.keyboard('{1}{ }{ArrowDown}{Enter}{ArrowDown>2/}{Enter}');

        // Expect
        await notNullByText(screen, '1 cup chicken,', 'skip prep method');
    });
    it('should display all prepMethod options', async () => {
        const user = userEvent.setup();
        // Render
        renderComponent();

        // Act
        const ingredientInput = screen.getByText('Enter ingredient');
        await user.click(ingredientInput);
        await user.keyboard('{1}{ }{ArrowDown>2/}{Enter}{ArrowDown}{Enter}');

        // Expect
        await notNullByText(screen, 'chopped', 'diced', 'sliced', 'whole');
    });
    it('should display add new prepMethod', async () => {
        const user = userEvent.setup();
        // Render
        renderComponent();

        // Act
        const ingredientInput = screen.getByText('Enter ingredient');
        await user.click(ingredientInput);
        await user.keyboard('{1}{ }{ArrowDown>2/}{Enter}{ArrowDown}{Enter}chi');

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
        await user.keyboard('{1}{ }{ArrowDown>2/}{Enter}{ArrowDown}{Enter}{1}');

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
        await user.keyboard('{1}{ }{ArrowDown}{Enter}{ArrowDown>2/}{Enter}');
        await user.click(screen.getByText('skip prep method'));

        // Expect
        await notNullByText(screen, '1 cup chicken', 'Enter ingredient');
    });
    it('should open up the new prepMethod popover', async () => {
        const user = userEvent.setup();
        // Render
        renderComponent();

        // Act
        const quantityInput = screen.getByText('Enter ingredient');
        await user.click(quantityInput);
        await user.keyboard('{1}{ }{ArrowDown>2/}{Enter}{ArrowDown}{Enter}chi{Enter}');

        // Expect
        await notNullByText(screen, 'Add new prep method', 'Save');
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
        await clickGetByText(screen, user, 'cup', 'chicken');
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
        await clickGetByText(screen, user, 'chicken', 'skip prep method');

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
        await notNullByText(screen, '1 cup chicken, chi', 'Add new prep method', 'Save');
    });
});
