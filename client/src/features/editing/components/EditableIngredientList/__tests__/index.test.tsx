import '@testing-library/jest-dom';
import userEvent from '@testing-library/user-event';
import { render, screen, getDefaultNormalizer } from '@testing-library/react';
import { ChakraProvider } from '@chakra-ui/react';
import { MockedProvider } from '@apollo/client/testing';
import { EditableIngredientList } from '..';
import { mockGetUnits } from '../__mocks__/GetUnits';
import { mockGetIngredientsWithRecipe } from '../__mocks__/GetIngredients';
import { mockGetPrepMethods } from '../__mocks__/GetPrepMethods';
import { RouterProvider } from 'react-router-dom';
import { createBrowserRouter, createRoutesFromElements, Route } from 'react-router-dom';
import { useIngredientList } from '../../../hooks/useIngredientList';
import { loadErrorMessages, loadDevMessages } from '@apollo/client/dev';

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
        <MockedProvider mocks={[mockGetUnits, mockGetIngredientsWithRecipe, mockGetPrepMethods]}>
            <ChakraProvider>
                <RouterProvider router={routes} />
            </ChakraProvider>
        </MockedProvider>
    );
};

describe('EditableIngredient Quantity Keyboard', () => {
    it('should enter a quantity', async () => {
        const user = userEvent.setup();
        // Render
        renderComponent();

        // Act
        const ingredientInput = screen.getByText('Enter ingredient');
        await user.click(ingredientInput);
        await user.keyboard('1');

        // Expect
        expect(screen.getByText('1')).toBeInTheDocument();
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
        expect(screen.getByText('Enter ingredient')).toBeInTheDocument();
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
            screen.getByText('2.5 ', { normalizer: getDefaultNormalizer({ trim: false }) })
        ).toBeInTheDocument();
        expect(screen.getByText('skip unit')).toBeInTheDocument();
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
            screen.getByText('½ ', { normalizer: getDefaultNormalizer({ trim: false }) })
        ).toBeInTheDocument();
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
            screen.getByText('1.5-2.5 ', { normalizer: getDefaultNormalizer({ trim: false }) })
        ).toBeInTheDocument();
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
            screen.getByText('1/2', { normalizer: getDefaultNormalizer({ trim: false }) })
        ).toBeInTheDocument();
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
        expect(screen.getByText('Invalid input')).toBeInTheDocument();
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
        expect(screen.getByText('Invalid input')).toBeInTheDocument();
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
        expect(screen.getByText('chicken')).toBeInTheDocument();
        expect(screen.getByText('apple')).toBeInTheDocument();
    });
});
describe('EditableIngredient Quantity Click', () => {
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
        expect(screen.getByText('Enter ingredient')).toBeInTheDocument();
    });
});
describe('EditableIngredient Unit Keyboard', () => {
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
        expect(screen.getByText('Enter ingredient')).toBeInTheDocument();
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
            screen.getByText('1 cup ', { normalizer: getDefaultNormalizer({ trim: false }) })
        ).toBeInTheDocument();
        expect(
            screen.queryByText('1 cup  ', { normalizer: getDefaultNormalizer({ trim: false }) })
        ).toBeNull();
        expect(screen.getByText('chicken')).toBeInTheDocument();
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
            screen.getByText('2 cups ', { normalizer: getDefaultNormalizer({ trim: false }) })
        ).toBeInTheDocument();
        expect(screen.getByText('chicken')).toBeInTheDocument();
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
        expect(screen.getByText('skip unit')).toBeInTheDocument();
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
            screen.getByText('1 ', { normalizer: getDefaultNormalizer({ trim: false }) })
        ).toBeInTheDocument();
        expect(screen.getByText('teaspoon')).toBeInTheDocument();
        expect(screen.getByText('gram')).toBeInTheDocument();
        expect(screen.getByText('ounce')).toBeInTheDocument();
        expect(screen.getByText('cup')).toBeInTheDocument();
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
        expect(screen.getByText('Add new unit')).toBeInTheDocument();
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
        expect(screen.getByText('Invalid input')).toBeInTheDocument();
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
            screen.getByText('1 ', { normalizer: getDefaultNormalizer({ trim: false }) })
        ).toBeInTheDocument();
        expect(screen.getByText('chicken')).toBeInTheDocument();
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
        expect(screen.getByText('Add new unit')).toBeInTheDocument();
        expect(screen.getByText('Save')).toBeInTheDocument();
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
            screen.getByText('1 cup ', { normalizer: getDefaultNormalizer({ trim: false }) })
        ).toBeInTheDocument();
        expect(
            screen.queryByText('1 cup  ', {
                normalizer: getDefaultNormalizer({ trim: false, collapseWhitespace: false }),
            })
        ).toBeNull();
        expect(screen.getByText('chicken')).toBeInTheDocument();
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
            screen.getByText('2 cups ', { normalizer: getDefaultNormalizer({ trim: false }) })
        ).toBeInTheDocument();
        expect(screen.getByText('chicken')).toBeInTheDocument();
    });
});
describe('EditableIngredient Unit Click', () => {
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
            screen.getByText('1 cup ', { normalizer: getDefaultNormalizer({ trim: false }) })
        ).toBeInTheDocument();
        expect(screen.getByText('chicken')).toBeInTheDocument();
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
            screen.getByText('2 cups ', { normalizer: getDefaultNormalizer({ trim: false }) })
        ).toBeInTheDocument();
        expect(screen.getByText('chicken')).toBeInTheDocument();
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
        expect(screen.getByText('Enter ingredient')).toBeInTheDocument();
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
            screen.getByText('1 ', { normalizer: getDefaultNormalizer({ trim: false }) })
        ).toBeInTheDocument();
        expect(screen.getByText('chicken')).toBeInTheDocument();
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
        expect(screen.getByText('Add new unit')).toBeInTheDocument();
        expect(screen.getByText('Save')).toBeInTheDocument();
    });
});
describe('EditableIngredient Ingredient Keyboard', () => {
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
        expect(screen.getByText('1 cup chicken,')).toBeInTheDocument();
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
        expect(screen.getByText('Enter ingredient')).toBeInTheDocument();
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
        expect(screen.getByText('apples')).toBeInTheDocument();
        expect(screen.getByText('carrots')).toBeInTheDocument();
        expect(screen.getByText('chicken')).toBeInTheDocument();
        expect(screen.getByText('iceberg lettuce')).toBeInTheDocument();
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
        expect(screen.getByText('add new ingredient')).toBeInTheDocument();
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
        expect(screen.getByText('Invalid input')).toBeInTheDocument();
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
        expect(screen.getByText('Add new ingredient')).toBeInTheDocument();
        expect(screen.getByText('Save')).toBeInTheDocument();
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
        expect(screen.getByText('2 apples,')).toBeInTheDocument();
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
        expect(screen.getByText('1 cup apples')).toBeInTheDocument();
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
        expect(screen.getByText('skip quantity')).toBeInTheDocument();
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
        expect(screen.getByText('skip quantity')).toBeInTheDocument();
    });
});
describe('EditableIngredient Ingredient Click', () => {
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
        expect(screen.getByText('Enter ingredient')).toBeInTheDocument();
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
        expect(screen.getByText('Add new ingredient')).toBeInTheDocument();
        expect(screen.getByText('Save')).toBeInTheDocument();
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
        expect(screen.getByText('2 apples')).toBeInTheDocument();
    });
});
describe('EditableIngredient PrepMethod Keyboard', () => {
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
        expect(screen.getByText('Enter ingredient')).toBeInTheDocument();
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
        expect(screen.getByText('1 cup chicken,')).toBeInTheDocument();
        expect(screen.getByText('skip prep method')).toBeInTheDocument();
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
        expect(screen.getByText('chopped')).toBeInTheDocument();
        expect(screen.getByText('diced')).toBeInTheDocument();
        expect(screen.getByText('sliced')).toBeInTheDocument();
        expect(screen.getByText('whole')).toBeInTheDocument();
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
        expect(screen.getByText('add new prep method')).toBeInTheDocument();
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
        expect(screen.getByText('Invalid input')).toBeInTheDocument();
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
        expect(screen.getByText('1 cup chicken')).toBeInTheDocument();
        expect(screen.getByText('Enter ingredient')).toBeInTheDocument();
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
        expect(screen.getByText('Add new prep method')).toBeInTheDocument();
        expect(screen.getByText('Save')).toBeInTheDocument();
    });
});
describe('EditableIngredient PrepMethod Click', () => {
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
        expect(screen.getByText('Enter ingredient')).toBeInTheDocument();
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
        expect(screen.getByText('1 cup chicken')).toBeInTheDocument();
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
        expect(screen.getByText('1 cup chicken, chi')).toBeInTheDocument();
        expect(screen.getByText('Add new prep method')).toBeInTheDocument();
        expect(screen.getByText('Save')).toBeInTheDocument();
    });
});

describe('FinishedIngredient', () => {
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
        expect(screen.getByText('1 oz chicken, chopped')).toBeInTheDocument();
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
        expect(screen.getByText('1 oz chicken, chopped')).toBeInTheDocument();
        expect(screen.getByText('2 oz iceberg lettuce, diced')).toBeInTheDocument();
        expect(screen.getByText('Enter ingredient')).toBeInTheDocument();
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
        expect(screen.getByText('1 chicken, chopped')).toBeInTheDocument();
        expect(screen.getByText('Enter ingredient')).toBeInTheDocument();
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
        expect(screen.getByText('1 oz chicken')).toBeInTheDocument();
        expect(screen.getByText('Enter ingredient')).toBeInTheDocument();
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
        expect(screen.getByText('1 chicken')).toBeInTheDocument();
        expect(screen.getByText('Enter ingredient')).toBeInTheDocument();
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
        expect(screen.getByText('2 cups chicken, chopped')).toBeInTheDocument();
        expect(screen.getByText('Enter ingredient')).toBeInTheDocument();
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
        expect(screen.getByText('2 chickens, chopped')).toBeInTheDocument();
        expect(screen.getByText('Enter ingredient')).toBeInTheDocument();
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
        expect(screen.getByText('chicken, chopped')).toBeInTheDocument();
        expect(screen.getByText('Enter ingredient')).toBeInTheDocument();
    });
    it('should rearrange the order of the items', async () => {}); // TODO
});
