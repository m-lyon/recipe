import { afterEach, describe, expect, it } from 'vitest';
import { cleanup, screen } from '@testing-library/react';
import { Route, createRoutesFromElements } from 'react-router-dom';

import { PATH } from '@recipe/constants';
import { MockedResponses, renderPage } from '@recipe/utils/tests';
import { mockCurrentUserUnverified } from '@recipe/graphql/queries/__mocks__/user';
import { mockCurrentUser, mockCurrentUserNull } from '@recipe/graphql/queries/__mocks__/user';

import { RequireAuth } from '../RequireAuth';

const renderComponent = (mocks: MockedResponses) => {
    const routes = createRoutesFromElements(
        <Route path={PATH.ROOT}>
            <Route index element={<div>Home page</div>} />
            <Route element={<RequireAuth />}>
                <Route path='private' element={<div>Private page</div>} />
            </Route>
        </Route>
    );
    return renderPage(routes, mocks, [`${PATH.ROOT}/private`]);
};

describe('RequireAuth', () => {
    afterEach(() => {
        cleanup();
    });

    it('should render the page for verified users', async () => {
        renderComponent([mockCurrentUser]);

        expect(await screen.findByText('Private page')).not.toBeNull();
    });

    it('should redirect signed-out users to the home page', async () => {
        const { router } = renderComponent([mockCurrentUserNull]);

        expect(await screen.findByText('Home page')).not.toBeNull();
        expect(screen.queryByText('Private page')).toBeNull();
        // Replace, so Back doesn't return to the blocked route
        expect(router.state.historyAction).toBe('REPLACE');
    });

    it('should redirect unverified users to the home page', async () => {
        const { router } = renderComponent([mockCurrentUserUnverified]);

        expect(await screen.findByText('Home page')).not.toBeNull();
        expect(screen.queryByText('Private page')).toBeNull();
        expect(router.state.historyAction).toBe('REPLACE');
    });
});
