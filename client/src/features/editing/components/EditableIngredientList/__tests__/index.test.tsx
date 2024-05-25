import { ChakraProvider } from '@chakra-ui/react';
import { RouterProvider } from 'react-router-dom';
import userEvent from '@testing-library/user-event';
import { MockedProvider } from '@apollo/client/testing';
import { afterEach, describe, expect, it } from 'vitest';
import { loadDevMessages, loadErrorMessages } from '@apollo/client/dev';
import { cleanup, getDefaultNormalizer, render, screen } from '@testing-library/react';
import { Route, createBrowserRouter, createRoutesFromElements } from 'react-router-dom';

import { mockGetUnits } from '@recipe/graphql/queries/__mocks__/unit';
import { mockCreateUnit } from '@recipe/graphql/mutations/__mocks__/unit';
import { mockGetPrepMethods } from '@recipe/graphql/queries/__mocks__/prepMethod';
import { mockCreatePrepMethod } from '@recipe/graphql/mutations/__mocks__/prepMethod';
import { mockCreateIngredient } from '@recipe/graphql/mutations/__mocks__/ingredient';
import { mockGetUnitConversions } from '@recipe/graphql/queries/__mocks__/unitConversion';
import { mockGetIngredientsWithRecipe } from '@recipe/graphql/queries/__mocks__/ingredient';

import { EditableIngredientList } from '..';
import { useIngredientList } from '../../../hooks/useIngredientList';

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

describe('EditableIngredient Quantity Keyboard', () => {
    afterEach(() => {
        cleanup();
    });

    it('should enter a quantity', async () => {
        const user = userEvent.setup();
        // Render
        renderComponent();

        // Act
        const ingredientInput = screen.getByText('Enter ingredient');
        await user.click(ingredientInput);
        await user.keyboard('1');

        // Expect
        expect(screen.queryByText('1')).not.toBeNull();
    });
    it('should reset via escape key', async () => {
        const user = userEvent.setup();
        // Render
        renderComponent();

        // Act
        const ingredientInput = screen.getByText('Enter ingredient');
        await user.click(ingredientInput);
        await user.keyboard('{1}');
        await user.keyboard('{Escape}');

        // Expect
        expect(screen.queryByText('Enter ingredient')).not.toBeNull();
    });
    it('should switch to the unit state', async () => {
        const user = userEvent.setup();
        // Render
        renderComponent();

        // Act
        const ingredientInput = screen.getByText('Enter ingredient');
        await user.click(ingredientInput);
        await user.keyboard('{2}{.}{5}{ }');

        // Expect
        expect(
            screen.queryByText('2.5 ', { normalizer: getDefaultNormalizer({ trim: false }) })
        ).not.toBeNull();
        expect(screen.queryByText('skip unit')).not.toBeNull();
    });
    it('should display a fraction', async () => {
        const user = userEvent.setup();
        // Render
        renderComponent();

        // Act
        const quantityInput = screen.getByText('Enter ingredient');
        await user.click(quantityInput);
        await user.keyboard('{1}{{/}}{2}{ }');

        // Expect
        expect(
            screen.queryByText('½ ', { normalizer: getDefaultNormalizer({ trim: false }) })
        ).not.toBeNull();
    });
    it('should allow a number range', async () => {
        const user = userEvent.setup();
        // Render
        renderComponent();

        // Act
        const quantityInput = screen.getByText('Enter ingredient');
        await user.click(quantityInput);
        await user.keyboard('{1}{.}{5}{{-}}{2}{.}{5}{ }');

        // Expect
        expect(
            screen.queryByText('1.5-2.5 ', { normalizer: getDefaultNormalizer({ trim: false }) })
        ).not.toBeNull();
    });
    it('should reset the fraction display', async () => {
        const user = userEvent.setup();
        // Render
        renderComponent();

        // Act
        const quantityInput = screen.getByText('Enter ingredient');
        await user.click(quantityInput);
        await user.keyboard('{1}{{/}}{2}{ }');
        await user.keyboard('{Backspace}');

        // Expect
        expect(
            screen.queryByText('1/2', { normalizer: getDefaultNormalizer({ trim: false }) })
        ).not.toBeNull();
    });
    it('should display an error message for alphabetic character', async () => {
        const user = userEvent.setup();
        // Render
        renderComponent();

        // Act
        const quantityInput = screen.getByText('Enter ingredient');
        await user.click(quantityInput);
        await user.keyboard('{1}{a}');

        // Expect
        expect(screen.queryByText('Invalid input')).not.toBeNull();
    });
    it('should display an error message for non alphanumeric character at start', async () => {
        const user = userEvent.setup();
        // Render
        renderComponent();

        // Act
        const quantityInput = screen.getByText('Enter ingredient');
        await user.click(quantityInput);
        await user.keyboard('{-}');

        // Expect
        expect(screen.queryByText('Invalid input')).not.toBeNull();
    });
    it('should skip the quantity', async () => {
        const user = userEvent.setup();
        // Render
        renderComponent();

        // Act
        const quantityInput = screen.getByText('Enter ingredient');
        await user.click(quantityInput);
        await user.click(screen.getByText('skip quantity'));

        // Expect
        expect(screen.queryByText('chicken')).not.toBeNull();
        expect(screen.queryByText('apple')).not.toBeNull();
    });
});
describe('EditableIngredient Quantity Click', () => {
    afterEach(() => {
        cleanup();
    });
    it('should reset via click away from element', async () => {
        const user = userEvent.setup();
        // Render
        renderComponent();

        // Act
        const ingredientInput = screen.getByText('Enter ingredient');
        await user.click(ingredientInput);
        await user.keyboard('{1}');
        await user.click(document.body);

        // Expect
        expect(screen.queryByText('Enter ingredient')).not.toBeNull();
    });
});
describe('EditableIngredient Unit Keyboard', () => {
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
        await user.keyboard('{1}{ }');
        await user.keyboard('{Escape}');

        // Expect
        expect(screen.queryByText('1 ')).toBeNull();
        expect(screen.queryByText('Enter ingredient')).not.toBeNull();
    });
    it('should switch to the ingredient state singular', async () => {
        const user = userEvent.setup();
        // Render
        renderComponent();

        // Act
        const ingredientInput = screen.getByText('Enter ingredient');
        await user.click(ingredientInput);
        await user.keyboard('{1}{ }{ArrowDown}{Enter}');

        // Expect
        expect(
            screen.queryByText('1 cup ', { normalizer: getDefaultNormalizer({ trim: false }) })
        ).not.toBeNull();
        expect(
            screen.queryByText('1 cup  ', { normalizer: getDefaultNormalizer({ trim: false }) })
        ).toBeNull();
        expect(screen.queryByText('chicken')).not.toBeNull();
    });
    it('should switch to the ingredient state plural', async () => {
        const user = userEvent.setup();
        // Render
        renderComponent();

        // Act
        const ingredientInput = screen.getByText('Enter ingredient');
        await user.click(ingredientInput);
        await user.keyboard('{2}{ }{ArrowDown}{Enter}');

        // Expect
        expect(
            screen.queryByText('2 cups ', { normalizer: getDefaultNormalizer({ trim: false }) })
        ).not.toBeNull();
        expect(screen.queryByText('chicken')).not.toBeNull();
    });
    it('should display skip unit', async () => {
        const user = userEvent.setup();
        // Render
        renderComponent();

        // Act
        const quantityInput = screen.getByText('Enter ingredient');
        await user.click(quantityInput);
        await user.keyboard('{1}{ }');

        // Expect
        expect(screen.queryByText('skip unit')).not.toBeNull();
    });
    it('should display all unit options', async () => {
        const user = userEvent.setup();
        // Render
        renderComponent();

        // Act
        const ingredientInput = screen.getByText('Enter ingredient');
        await user.click(ingredientInput);
        await user.keyboard('{1}{ }');

        // Expect
        expect(screen.queryByText('Enter ingredient')).toBeNull();
        expect(
            screen.queryByText('1 ', { normalizer: getDefaultNormalizer({ trim: false }) })
        ).not.toBeNull();
        expect(screen.queryByText('teaspoon')).not.toBeNull();
        expect(screen.queryByText('gram')).not.toBeNull();
        expect(screen.queryByText('ounce')).not.toBeNull();
        expect(screen.queryByText('cup')).not.toBeNull();
    });
    it('should display add new unit', async () => {
        const user = userEvent.setup();
        // Render
        renderComponent();

        // Act
        const ingredientInput = screen.getByText('Enter ingredient');
        await user.click(ingredientInput);
        await user.keyboard('{1}{ }');
        await user.keyboard('{c}{u}{t}{z}');

        // Expect
        expect(screen.queryByText('Add new unit')).not.toBeNull();
    });
    it('should display an error for a numeric character', async () => {
        const user = userEvent.setup();
        // Render
        renderComponent();

        // Act
        const ingredientInput = screen.getByText('Enter ingredient');
        await user.click(ingredientInput);
        await user.keyboard('{1}{ }');
        await user.keyboard('{1}');

        // Expect
        expect(screen.queryByText('Invalid input')).not.toBeNull();
    });
    it('should skip unit', async () => {
        const user = userEvent.setup();
        // Render
        renderComponent();

        // Act
        const quantityInput = screen.getByText('Enter ingredient');
        await user.click(quantityInput);
        await user.keyboard('{1}{ }');
        await user.click(screen.getByText('skip unit'));

        // Expect
        expect(
            screen.queryByText('1 ', { normalizer: getDefaultNormalizer({ trim: false }) })
        ).not.toBeNull();
        expect(screen.queryByText('chicken')).not.toBeNull();
    });
    it('should open up the new unit popover', async () => {
        const user = userEvent.setup();
        // Render
        renderComponent();

        // Act
        const quantityInput = screen.getByText('Enter ingredient');
        await user.click(quantityInput);
        await user.keyboard('{1}{ }');
        await user.keyboard('{c}{u}{t}{z}');
        await user.keyboard('{ArrowDown}{Enter}');

        // Expect
        expect(screen.queryByText('Add new unit')).not.toBeNull();
        expect(screen.queryByText('Save')).not.toBeNull();
    });

    it('should reset back to the quantity state', async () => {
        const user = userEvent.setup();
        // Render
        renderComponent();

        // Act
        const quantityInput = screen.getByText('Enter ingredient');

        await user.click(quantityInput);
        await user.keyboard('{1}{ }');
        await user.keyboard('{g}{ }');
        await user.keyboard('{Backspace}{Backspace}');

        // Expect
        expect(screen.queryByText('chicken')).toBeNull();
        expect(screen.queryByText('1 g')).toBeNull();
    });
});
describe('EditableIngredient Unit Spacebar', () => {
    afterEach(() => {
        cleanup();
    });
    it('should switch to the ingredient state singular', async () => {
        const user = userEvent.setup();
        // Render
        renderComponent();

        // Act
        const quantityInput = screen.getByText('Enter ingredient');
        await user.click(quantityInput);
        await user.keyboard('{1}{ }');
        await user.keyboard('{c}{u}{p}{ }');

        // Expect
        expect(
            screen.queryByText('1 cup ', { normalizer: getDefaultNormalizer({ trim: false }) })
        ).not.toBeNull();
        expect(
            screen.queryByText('1 cup  ', {
                normalizer: getDefaultNormalizer({ trim: false, collapseWhitespace: false }),
            })
        ).toBeNull();
        expect(screen.queryByText('chicken')).not.toBeNull();
    });
    it('should switch to the ingredient state plural', async () => {
        const user = userEvent.setup();
        // Render
        renderComponent();

        // Act
        const quantityInput = screen.getByText('Enter ingredient');
        await user.click(quantityInput);
        await user.keyboard('{2}{ }');
        await user.keyboard('{c}{u}{p}{s}{ }');

        // Expect
        expect(
            screen.queryByText('2 cups ', { normalizer: getDefaultNormalizer({ trim: false }) })
        ).not.toBeNull();
        expect(screen.queryByText('chicken')).not.toBeNull();
    });
});
describe('EditableIngredient Unit Click', () => {
    afterEach(() => {
        cleanup();
    });
    it('should switch to the ingredient state singular', async () => {
        const user = userEvent.setup();
        // Render
        renderComponent();

        // Act
        const ingredientInput = screen.getByText('Enter ingredient');
        await user.click(ingredientInput);
        await user.keyboard('{1}{ }');
        await user.click(screen.getByText('cup'));

        // Expect
        expect(
            screen.queryByText('1 cup ', { normalizer: getDefaultNormalizer({ trim: false }) })
        ).not.toBeNull();
        expect(screen.queryByText('chicken')).not.toBeNull();
    });
    it('should switch to the ingredient state plural', async () => {
        const user = userEvent.setup();
        // Render
        renderComponent();

        // Act
        const ingredientInput = screen.getByText('Enter ingredient');
        await user.click(ingredientInput);
        await user.keyboard('{2}{ }');
        await user.click(screen.getByText('cups'));

        // Expect
        expect(
            screen.queryByText('2 cups ', { normalizer: getDefaultNormalizer({ trim: false }) })
        ).not.toBeNull();
        expect(screen.queryByText('chicken')).not.toBeNull();
    });
    it('should reset via click away', async () => {
        const user = userEvent.setup();
        // Render
        renderComponent();

        // Act
        const quantityInput = screen.getByText('Enter ingredient');
        await user.click(quantityInput);
        await user.keyboard('{1}{ }{c}');
        await user.click(document.body);

        // Expect
        expect(screen.queryByText('Enter ingredient')).not.toBeNull();
    });
    it('should skip unit', async () => {
        const user = userEvent.setup();
        // Render
        renderComponent();

        // Act
        const quantityInput = screen.getByText('Enter ingredient');
        await user.click(quantityInput);
        await user.keyboard('{1}{ }');
        await user.click(screen.getByText('skip unit'));

        // Expect
        expect(
            screen.queryByText('1 ', { normalizer: getDefaultNormalizer({ trim: false }) })
        ).not.toBeNull();
        expect(screen.queryByText('chicken')).not.toBeNull();
    });
    it('should open up the new unit popover', async () => {
        const user = userEvent.setup();
        // Render
        renderComponent();

        // Act
        const quantityInput = screen.getByText('Enter ingredient');
        await user.click(quantityInput);
        await user.keyboard('{1}{ }');
        await user.keyboard('{c}{u}{t}{z}');
        await user.click(screen.getByText('add new unit'));

        // Expect
        expect(screen.queryByText('Add new unit')).not.toBeNull();
        expect(screen.queryByText('Save')).not.toBeNull();
    });
});
describe('EditableIngredient Ingredient Keyboard', () => {
    afterEach(() => {
        cleanup();
    });
    it('should display completed ingredient', async () => {
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
    });
    it('should reset via escape key', async () => {
        const user = userEvent.setup();
        // Render
        renderComponent();

        // Act
        const ingredientInput = screen.getByText('Enter ingredient');
        await user.click(ingredientInput);
        await user.keyboard('{1}{ }');
        await user.click(screen.getByText('cup'));
        await user.keyboard('{Escape}');

        // Expect
        expect(screen.queryByText('Enter ingredient')).not.toBeNull();
    });
    it('should display all ingredient options', async () => {
        const user = userEvent.setup();
        // Render
        renderComponent();

        // Act
        const quantityInput = screen.getByText('Enter ingredient');
        await user.click(quantityInput);
        await user.keyboard('{1}{ }');
        await user.click(screen.getByText('cup'));

        // Expect
        expect(screen.queryByText('apples')).not.toBeNull();
        expect(screen.queryByText('carrots')).not.toBeNull();
        expect(screen.queryByText('chicken')).not.toBeNull();
        expect(screen.queryByText('iceberg lettuce')).not.toBeNull();
    });
    it('should display add new ingredient', async () => {
        const user = userEvent.setup();
        // Render
        renderComponent();

        // Act
        const quantityInput = screen.getByText('Enter ingredient');
        await user.click(quantityInput);
        await user.keyboard('{1}{ }');
        await user.click(screen.getByText('cup'));
        await user.keyboard('{a}{p}{f}');

        // Expect
        expect(screen.queryByText('add new ingredient')).not.toBeNull();
    });
    it('should display an error for a numeric character', async () => {
        const user = userEvent.setup();
        // Render
        renderComponent();

        // Act
        const quantityInput = screen.getByText('Enter ingredient');
        await user.click(quantityInput);
        await user.keyboard('{1}{ }');
        await user.click(screen.getByText('cup'));
        await user.keyboard('{1}');

        // Expect
        expect(screen.queryByText('Invalid input')).not.toBeNull();
    });
    it('should open up the new ingredient popover', async () => {
        const user = userEvent.setup();
        // Render
        renderComponent();

        // Act
        const quantityInput = screen.getByText('Enter ingredient');
        await user.click(quantityInput);
        await user.keyboard('{1}{ }');
        await user.click(screen.getByText('cup'));
        await user.keyboard('{a}{p}{f}');
        await user.keyboard('{ArrowDown}{Enter}');

        // Expect
        expect(screen.queryByText('Add new ingredient')).not.toBeNull();
        expect(screen.queryByText('Save')).not.toBeNull();
    });
    it('should have a plural ingredient', async () => {
        const user = userEvent.setup();
        // Render
        renderComponent();

        // Act
        const quantityInput = screen.getByText('Enter ingredient');
        await user.click(quantityInput);
        await user.keyboard('{2}{ }');
        await user.click(screen.getByText('skip unit'));
        await user.keyboard('{a}{p}{p}');
        await user.keyboard('{Enter}');

        // Expect
        expect(screen.queryByText('2 apples,')).not.toBeNull();
    });
    it('should have a plural countable noun ingredient with a unit', async () => {
        const user = userEvent.setup();
        // Render
        renderComponent();

        // Act
        const quantityInput = screen.getByText('Enter ingredient');
        await user.click(quantityInput);
        await user.keyboard('{1}{ }');
        await user.click(screen.getByText('cup'));
        await user.keyboard('{a}{p}{p}');
        await user.click(screen.getByText('apples'));
        await user.keyboard('{Enter}');

        // Expect
        expect(screen.queryByText('1 cup apples')).not.toBeNull();
    });
    it('should revert back to quantity state', async () => {
        const user = userEvent.setup();
        // Render
        renderComponent();

        // Act
        const quantityInput = screen.getByText('Enter ingredient');
        await user.click(quantityInput);
        await user.click(screen.getByText('skip quantity'));
        await user.keyboard('{Backspace}');

        // Expect
        expect(screen.queryByText('skip quantity')).not.toBeNull();
    });
    it('should revert back to quantity state after beginning to type', async () => {
        const user = userEvent.setup();
        // Render
        renderComponent();

        // Act
        const quantityInput = screen.getByText('Enter ingredient');
        await user.click(quantityInput);
        await user.click(screen.getByText('skip quantity'));
        await user.keyboard('{c}{Backspace}{Backspace}');

        // Expect
        expect(screen.queryByText('skip quantity')).not.toBeNull();
    });
});
describe('EditableIngredient Ingredient Click', () => {
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
        await user.keyboard('{c}{h}');
        await user.click(document.body);

        // Expect
        expect(screen.queryByText('Enter ingredient')).not.toBeNull();
    });
    it('should open up the new ingredient popover', async () => {
        const user = userEvent.setup();
        // Render
        renderComponent();

        // Act
        const quantityInput = screen.getByText('Enter ingredient');
        await user.click(quantityInput);
        await user.keyboard('{1}{ }');
        await user.click(screen.getByText('cup'));
        await user.keyboard('{a}{p}{f}');
        await user.click(screen.getByText('add new ingredient'));

        // Expect
        expect(screen.queryByText('Add new ingredient')).not.toBeNull();
        expect(screen.queryByText('Save')).not.toBeNull();
    });
    it('should have a plural ingredient', async () => {
        const user = userEvent.setup();
        // Render
        renderComponent();

        // Act
        const quantityInput = screen.getByText('Enter ingredient');
        await user.click(quantityInput);
        await user.keyboard('{2}{ }');
        await user.click(screen.getByText('skip unit'));
        await user.keyboard('{a}{p}{p}');
        await user.click(screen.getByText('apples'));
        await user.keyboard('{Enter}');

        // Expect
        expect(screen.queryByText('2 apples')).not.toBeNull();
    });
});
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

describe('Creating new items', () => {
    afterEach(() => {
        cleanup();
    });
    it('should create a new unit', async () => {
        const user = userEvent.setup();
        // Render
        renderComponent();

        // Act
        await user.click(screen.getByText('Enter ingredient'));
        await user.keyboard('{1}{ }{c}');
        await user.click(screen.getByText('add new unit'));
        await user.keyboard('{c}{u}{t}');
        await user.click(screen.getByText('Long singular name'));
        await user.keyboard('{c}{u}{t}{t}{i}{n}{g}');
        await user.click(screen.getByText('decimal'));
        await user.click(screen.getByText('Save'));

        // Expect
        expect(
            screen.queryByText('1 cut ', { normalizer: getDefaultNormalizer({ trim: false }) })
        ).not.toBeNull();
        expect(screen.queryByText('add new ingredient')).not.toBeNull();
    });
    it('should create a new ingredient', async () => {
        const user = userEvent.setup();
        // Render
        renderComponent();

        // Act
        await user.click(screen.getByText('Enter ingredient'));
        await user.keyboard('{1}{ }');
        await user.click(screen.getByText('skip unit'));
        await user.click(screen.getByText('add new ingredient'));
        await user.keyboard('{b}{e}{e}{f}');
        await user.click(screen.getByText('Save'));
        // Expect
        expect(
            screen.queryByText('1 beef, ', { normalizer: getDefaultNormalizer({ trim: false }) })
        ).not.toBeNull();
        expect(screen.queryByText('skip prep method')).not.toBeNull();
    });
    it('should create a new prepMethod', async () => {
        const user = userEvent.setup();
        // Render
        renderComponent();

        // Act
        await user.click(screen.getByText('Enter ingredient'));
        await user.keyboard('{1}{ }');
        await user.click(screen.getByText('skip unit'));
        await user.click(screen.getByText('chicken'));
        await user.keyboard('{p}');
        await user.click(screen.getByText('add new prep method'));
        await user.keyboard('{p}{i}{p}{p}{e}{d}');
        await user.click(screen.getByText('Save'));

        // Expect
        expect(screen.queryByText('1 chicken, pipped')).not.toBeNull();
        expect(screen.queryByText('Enter ingredient')).not.toBeNull();
    });
});

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
