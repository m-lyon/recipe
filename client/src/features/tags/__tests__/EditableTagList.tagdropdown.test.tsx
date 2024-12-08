import { userEvent } from '@testing-library/user-event';
import { cleanup, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { Route, createRoutesFromElements } from 'react-router-dom';

import { renderPage } from '@recipe/utils/tests';
import { mockGetManyTags } from '@recipe/graphql/queries/__mocks__/tag';
import { MockedResponses, notNullByText, nullByText } from '@recipe/utils/tests';
import { mockGetTags, mockGetTagsEmpty } from '@recipe/graphql/queries/__mocks__/tag';

import { EditableTag } from '../components/EditableTag';

const renderComponent = (mocks: MockedResponses) => {
    const routes = createRoutesFromElements(<Route path='/' element={<EditableTag />} />);
    return renderPage(routes, mocks);
};

describe('TagDropdown', () => {
    afterEach(() => {
        cleanup();
        vi.resetAllMocks();
    });

    it('should render the dropdown when tag.show is true', async () => {
        // Render
        const user = userEvent.setup();
        renderComponent([mockGetTags]);

        // Expect
        expect(await screen.findByText('Add a tag...')).not.toBeNull();
        await user.click(screen.getByText('Add a tag...'));
        await notNullByText(screen, 'dinner', 'lunch', 'freezable');
    });

    it('should not render the dropdown when tag.show is false', async () => {
        // Render
        renderComponent([mockGetTags]);

        // Expect
        expect(await screen.findByText('Add a tag...')).not.toBeNull();
        nullByText(screen, 'dinner', 'lunch', 'freezable');
    });

    it('should not render the suggestions list when data is not available', async () => {
        // Render
        const user = userEvent.setup();
        renderComponent([mockGetTagsEmpty]);

        // Expect
        expect(await screen.findByText('Add a tag...')).not.toBeNull();
        await user.click(screen.getByText('Add a tag...'));
        nullByText(screen, 'dinner', 'lunch', 'freezable');
    });

    it('should display a scrollbar when there are many tags', async () => {
        // Render
        const user = userEvent.setup();
        renderComponent([mockGetManyTags]);

        // Expect
        expect(await screen.findByText('Add a tag...')).not.toBeNull();
        await user.click(screen.getByText('Add a tag...'));
        const list = screen.getByLabelText('Tag suggestions');
        const computedStyle = window.getComputedStyle(list);
        expect(computedStyle.overflowY).toBe('auto');
    });
});
