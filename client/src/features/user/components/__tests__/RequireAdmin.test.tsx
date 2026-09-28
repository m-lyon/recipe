import { afterEach, describe, expect, it } from 'vitest';
import { cleanup, screen } from '@testing-library/react';
import { Route, createRoutesFromElements } from 'react-router-dom';

import { PATH } from '@recipe/constants';
import { MockedResponses, renderPage } from '@recipe/utils/tests';
import { mockCurrentUser, mockCurrentUserAdmin } from '@recipe/graphql/queries/__mocks__/user';

import { RequireAdmin } from '../RequireAdmin';

const renderComponent = (mocks: MockedResponses) => {
    const routes = createRoutesFromElements(
        <Route path={PATH.ROOT}>
            <Route index element={<div>Home page</div>} />
            <Route element={<RequireAdmin />}>
                <Route path='admin' element={<div>Admin page</div>} />
            </Route>
        </Route>
    );
    return renderPage(routes, mocks, [`${PATH.ROOT}/admin`]);
};

describe('RequireAdmin', () => {
    afterEach(() => {
        cleanup();
    });

    it('should render the page for admins', async () => {
        renderComponent([mockCurrentUserAdmin]);

        expect(await screen.findByText('Admin page')).not.toBeNull();
    });

    it('should redirect non-admins to the home page', async () => {
        renderComponent([mockCurrentUser]);

        expect(await screen.findByText('Home page')).not.toBeNull();
        expect(screen.queryByText('Admin page')).toBeNull();
    });
});
