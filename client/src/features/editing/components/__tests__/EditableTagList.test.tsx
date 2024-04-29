import { RouterProvider } from 'react-router-dom';
import { ChakraProvider } from '@chakra-ui/react';
import userEvent from '@testing-library/user-event';
import { MockedProvider } from '@apollo/client/testing';
import { afterEach, describe, expect, it } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';
import { Route, createBrowserRouter, createRoutesFromElements } from 'react-router-dom';

import { mockGetTags } from '../__mocks__/GetTags';
import { useTagList } from '../../hooks/useTagList';
import { EditableTagList } from '../EditableTagList';

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
    afterEach(() => {
        cleanup();
    });
    it('should display tag options', async () => {
        const user = userEvent.setup();
        // Render
        renderComponent();

        // Act
        const tagInput = screen.getByText('Add a tag...');
        await user.click(tagInput);

        // Expect
        expect(screen.queryByText('Add a tag...')).not.toBeNull();
        expect(screen.queryByText('lunch')).not.toBeNull();
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
        expect(screen.queryByText('Add a tag...')).not.toBeNull();
        expect(screen.queryByText('lunch')).not.toBeNull();
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
    afterEach(() => {
        cleanup();
    });
    it('should display completed tag', async () => {
        // Render
        const user = userEvent.setup();
        renderComponent();

        // Act
        const tagInput = screen.getByText('Add a tag...');
        await user.click(tagInput);
        await user.keyboard('{l}{Enter}');

        // Expect
        expect(screen.queryByText('Add a tag...')).not.toBeNull();
        expect(screen.queryByText('lunch')).not.toBeNull();
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
