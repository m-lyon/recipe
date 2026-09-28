import { afterEach, describe, expect, it } from 'vitest';
import { cleanup, screen } from '@testing-library/react';
import { Route, createRoutesFromElements } from 'react-router-dom';
import { loadDevMessages, loadErrorMessages } from '@apollo/client/dev';

import { MockedResponses, renderPage } from '@recipe/utils/tests';
import { mockGetTags } from '@recipe/graphql/queries/__mocks__/tag';
import { mockCurrentUser } from '@recipe/graphql/queries/__mocks__/user';
import { mockCurrentUserAdmin } from '@recipe/graphql/queries/__mocks__/user';

import { Navbar } from '../Navbar';

loadErrorMessages();
loadDevMessages();

const renderComponent = (mocks: MockedResponses) => {
    const routes = createRoutesFromElements(<Route path='/' element={<Navbar />} />);
    return renderPage(routes, [mockGetTags, ...mocks]);
};

describe('Navbar', () => {
    afterEach(() => {
        cleanup();
    });

    it('should show unit conversion entries to admins', async () => {
        // Render
        renderComponent([mockCurrentUserAdmin]);

        // Expect
        expect((await screen.findAllByLabelText('Create new recipe')).length).toBeGreaterThan(0);
        expect(screen.queryAllByLabelText('Create new unit conversion rule')).not.toHaveLength(0);
        expect(screen.queryAllByLabelText('Edit existing unit conversion')).not.toHaveLength(0);
    });

    it('should hide unit conversion entries from non-admins', async () => {
        // Render
        renderComponent([mockCurrentUser]);

        // Expect
        expect((await screen.findAllByLabelText('Create new recipe')).length).toBeGreaterThan(0);
        expect(screen.queryAllByLabelText('Create new unit conversion rule')).toHaveLength(0);
        expect(screen.queryAllByLabelText('Edit existing unit conversion')).toHaveLength(0);
        expect(screen.queryAllByLabelText('Edit existing unit')).not.toHaveLength(0);
    });
});
