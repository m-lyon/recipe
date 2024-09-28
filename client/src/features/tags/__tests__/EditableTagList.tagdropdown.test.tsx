import { cleanup, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { Route, createRoutesFromElements } from 'react-router-dom';

import { mockGetManyTags } from '@recipe/graphql/queries/__mocks__/tag';
import { mockGetTags, mockGetTagsEmpty } from '@recipe/graphql/queries/__mocks__/tag';
import { MockedResponses, notNullByText, nullByText, renderPage } from '@recipe/utils/tests';

import { EditableTag } from '../components/EditableTag';

const renderComponent = (mocks: MockedResponses, additionalProps = {}) => {
    const props = {
        tag: {
            show: true,
            value: '',
        },
        tagStr: '',
        actions: {
            setAndSubmit: vi.fn(),
            setShow: vi.fn(),
            reset: vi.fn(),
            setValue: vi.fn(),
            submit: vi.fn(),
        },
        selectedTags: [],
        ...additionalProps,
    };
    const routes = createRoutesFromElements(
        <Route path='/' element={<EditableTag {...props} />} />
    );
    renderPage(routes, mocks);
};

describe('TagDropdown', () => {
    afterEach(() => {
        cleanup();
        vi.resetAllMocks();
    });

    it('should render the dropdown when tag.show is true', async () => {
        // Render
        renderComponent([mockGetTags]);

        // Expect
        expect(await screen.findByText('Add a tag...')).not.toBeNull();
        await notNullByText(screen, 'dinner', 'lunch', 'freezable');
    });

    it('should not render the dropdown when tag.show is false', async () => {
        // Render
        renderComponent([mockGetTags], { tag: { show: false, value: '' } });

        // Expect
        expect(await screen.findByText('Add a tag...')).not.toBeNull();
        nullByText(screen, 'dinner', 'lunch', 'freezable');
    });

    it('should not render the suggestions list when data is not available', async () => {
        // Render
        renderComponent([mockGetTagsEmpty]);

        // Expect
        expect(await screen.findByText('Add a tag...')).not.toBeNull();
        nullByText(screen, 'dinner', 'lunch', 'freezable');
    });

    it('should display a scrollbar when there are many tags', async () => {
        // Render
        renderComponent([mockGetManyTags]);

        // Expect
        expect(await screen.findByText('Add a tag...')).not.toBeNull();
        const list = screen.getByLabelText('Tag suggestions');
        const computedStyle = window.getComputedStyle(list);
        expect(computedStyle.overflowY).toBe('auto');
    });
});
