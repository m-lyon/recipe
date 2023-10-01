import '@testing-library/jest-dom';
import { render, screen, getDefaultNormalizer } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ChakraProvider } from '@chakra-ui/react';
import { MockedProvider } from '@apollo/client/testing';
import { CreateRecipe } from '..';
import { mockGetIngredientOpts } from '../__mocks__/GetIngredientOpts';

jest.mock('constants.ts', () => ({
    MOCK_USER_ID: '64fb959fb7c183fca4e72176',
}));

const renderComponent = () => {
    render(
        <MockedProvider mocks={mockGetIngredientOpts} addTypename={false}>
            <ChakraProvider>
                <CreateRecipe />
            </ChakraProvider>
        </MockedProvider>
    );
};

describe('EditableIngredient Click Action', () => {
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

    it('should switch to the unit state', async () => {
        const user = userEvent.setup();
        // Render
        renderComponent();

        // Act
        const ingredientInput = screen.getByText('Enter ingredient');
        await user.click(ingredientInput);
        await user.keyboard('{1}{ }');

        // Expect
        expect(
            screen.getByText('1 ', { normalizer: getDefaultNormalizer({ trim: false }) })
        ).toBeInTheDocument();
        expect(screen.getByText('skip unit')).toBeInTheDocument();
    });

    it('should reset when in unit state via escape key', async () => {
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

    it('should switch to the name state', async () => {
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

    it('should reset when in name state via escape key', async () => {
        // TODO: this should fail, but it doesn't. Why?

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
});

describe('EditableIngredient Key Arrow Action', () => {
    it('should display completed unit', async () => {
        const user = userEvent.setup();
        // Render
        renderComponent();

        // Act
        const ingredientInput = screen.getByText('Enter ingredient');
        await user.click(ingredientInput);
        await user.keyboard('{1}{ }{ArrowDown}{ArrowDown}{Enter}');

        // Expect
        expect(
            screen.getByText('1 cup ', { normalizer: getDefaultNormalizer({ trim: false }) })
        ).toBeInTheDocument();
    });

    it('should display completed name', async () => {
        const user = userEvent.setup();
        // Render
        renderComponent();

        // Act
        const ingredientInput = screen.getByText('Enter ingredient');
        await user.click(ingredientInput);
        await user.keyboard('{1}{ }{ArrowDown}{ArrowDown}{Enter}');
        await user.keyboard('{Enter}');

        // Expect
        expect(screen.getByText('1 cup carrot')).toBeInTheDocument();
    });
});
