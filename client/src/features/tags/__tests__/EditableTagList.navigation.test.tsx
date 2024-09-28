import { userEvent } from '@testing-library/user-event';
import { afterEach, describe, expect, it } from 'vitest';
import { cleanup, screen } from '@testing-library/react';
import { Route, createRoutesFromElements } from 'react-router-dom';

import { mockGetTags } from '@recipe/graphql/queries/__mocks__/tag';
import { clickGetByText, notNullByText, renderPage } from '@recipe/utils/tests';

import { useTagList } from '../hooks/useTagList';
import { EditableTagList } from '../components/EditableTagList';

const renderComponent = () => {
    const MockCreateRecipe = () => {
        const props = useTagList();
        return <EditableTagList {...props} />;
    };
    const routes = createRoutesFromElements(<Route path='/' element={<MockCreateRecipe />} />);
    renderPage(routes, [mockGetTags]);
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
        await notNullByText(screen, 'Add a tag...', 'lunch');
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
        await notNullByText(screen, 'Add a tag...', 'lunch');
    });

    it('should unfocus when clicked away after first tag', async () => {
        // Render
        const user = userEvent.setup();
        renderComponent();

        // Act
        await clickGetByText(screen, user, 'Add a tag...', 'lunch', 'Add a tag...');
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
        await notNullByText(screen, 'Add a tag...', 'lunch');
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
