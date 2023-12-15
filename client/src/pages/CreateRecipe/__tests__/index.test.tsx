import '@testing-library/jest-dom';
import userEvent from '@testing-library/user-event';
import { render, screen, getDefaultNormalizer } from '@testing-library/react';
import { ChakraProvider } from '@chakra-ui/react';
import { MockedProvider } from '@apollo/client/testing';
import { CreateRecipe } from '..';
import { mockGetUnits } from '../__mocks__/GetUnits';
import { mockGetIngredients } from '../__mocks__/GetIngredients';
import { mockGetPrepMethods } from '../__mocks__/GetPrepMethods';
import { mockGetTags } from '../__mocks__/GetTags';
import { RouterProvider } from 'react-router-dom';
import { createBrowserRouter, createRoutesFromElements, Route } from 'react-router-dom';

jest.mock('constants.ts', () => ({
    MOCK_USER_ID: '64fb959fb7c183fca4e72176',
}));

const routes = createBrowserRouter(
    createRoutesFromElements(<Route path='/' element={<CreateRecipe />} />)
);

const renderComponent = () => {
    render(
        <MockedProvider
            mocks={[mockGetUnits, mockGetIngredients, mockGetPrepMethods, mockGetTags]}
            addTypename={false}
        >
            <ChakraProvider>
                <RouterProvider router={routes} />
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
        await user.keyboard('{ArrowDown}{Enter}');

        // Expect
        expect(screen.getByText('1 cup apple')).toBeInTheDocument();
    });
});

describe('EditableTag Click Action', () => {
    it('should display tag options', async () => {
        const user = userEvent.setup();
        // Render
        renderComponent();

        // Act
        const tagInput = screen.getByText('Add a tag...');
        await user.click(tagInput);

        // Expect
        expect(screen.getByText('Add a tag...')).toBeInTheDocument();
        expect(screen.getByText('lunch')).toBeInTheDocument();
    });

    it('should display completed tag', async () => {
        // Render
        const user = userEvent.setup();
        renderComponent();

        // Act
        const tagInput = screen.getByText('Add a tag...');
        await user.click(tagInput);
        await user.keyboard('{L}');
        const tag = screen.getByText('lunch');
        await user.click(tag);

        // Expect
        expect(screen.getByText('Add a tag...')).toBeInTheDocument();
        expect(screen.getByText('lunch')).toBeInTheDocument();
    });

    it('should unfocus when clicked away after first tag', async () => {
        // Render
        const user = userEvent.setup();
        renderComponent();

        // Act
        await user.click(screen.getByText('Add a tag...'));
        await user.click(screen.getByText('lunch'));
        await user.click(screen.getByText('Add a tag...'));
        await user.click(document.body);

        // Expect
        expect(screen.queryByText('dinner')).toBeNull();
    });
});

describe('EditableTag Key Arrow Action', () => {
    it('should display completed tag', async () => {
        // Render
        const user = userEvent.setup();
        renderComponent();

        // Act
        const tagInput = screen.getByText('Add a tag...');
        await user.click(tagInput);
        await user.keyboard('{l}{ArrowDown}{Enter}');

        // Expect
        expect(screen.getByText('Add a tag...')).toBeInTheDocument();
        expect(screen.getByText('lunch')).toBeInTheDocument();
    });

    it('should not still be focused on editable input', async () => {
        const user = userEvent.setup();
        // Render
        renderComponent();

        // Act
        const tagInput = screen.getByText('Add a tag...');
        await user.click(tagInput);
        await user.keyboard('{l}{ArrowDown}{Enter}');

        // Expect
        const inputElements = screen.getAllByRole('textbox', { hidden: true });
        const inputWithSpecificValue = inputElements.find((element) => {
            const value = element.getAttribute('value');
            return value === 'Add a tag...';
        });
        expect(document.activeElement).not.toBe(inputWithSpecificValue);
    });
});
