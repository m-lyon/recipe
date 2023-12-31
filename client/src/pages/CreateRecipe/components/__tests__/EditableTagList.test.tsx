import '@testing-library/jest-dom';
import userEvent from '@testing-library/user-event';
import { RouterProvider } from 'react-router-dom';
import { createBrowserRouter, createRoutesFromElements, Route } from 'react-router-dom';
import { render, screen } from '@testing-library/react';
import { ChakraProvider } from '@chakra-ui/react';
import { MockedProvider } from '@apollo/client/testing';
import { EditableTagList } from '../EditableTagList';
import { mockGetTags } from '../__mocks__/GetTags';
import { useTagList } from '../../hooks/useTagList';

const MockCreateRecipe = () => {
    const props = useTagList();
    return <EditableTagList {...props} />;
};

const routes = createBrowserRouter(
    createRoutesFromElements(<Route path='/' element={<MockCreateRecipe />} />)
);

const renderComponent = () => {
    render(
        <MockedProvider mocks={[mockGetTags]} addTypename={false}>
            <ChakraProvider>
                <RouterProvider router={routes} />
            </ChakraProvider>
        </MockedProvider>
    );
};

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
        await user.keyboard('{l}{Enter}');

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
