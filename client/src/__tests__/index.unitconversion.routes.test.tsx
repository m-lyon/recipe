import { cleanup, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { loadDevMessages, loadErrorMessages } from '@apollo/client/dev';

import { PATH } from '@recipe/constants';
import { renderPage } from '@recipe/utils/tests';
import { mockCurrentUser, mockCurrentUserAdmin } from '@recipe/graphql/queries/__mocks__/user';

import { routes } from '../routes';
import { mocks } from '../__mocks__/graphql';

loadErrorMessages();
loadDevMessages();

const renderAs = (currentUser: typeof mockCurrentUser, path: string) => {
    const userMocks = [currentUser, ...mocks.filter((m) => m !== mockCurrentUserAdmin)];
    return renderPage(routes, userMocks, [path]);
};

describe.each([
    ['Create Unit Conversion', `${PATH.ROOT}/create/unit-conversion`],
    ['Edit Unit Conversion', `${PATH.ROOT}/edit/unit-conversion`],
])('Unit conversion route: %s', (heading, path) => {
    afterEach(() => {
        cleanup();
    });

    it('should render the page for admins', async () => {
        // Render -----------------------------------------------
        renderAs(mockCurrentUserAdmin, path);

        // Expect ------------------------------------------------
        expect(await screen.findByRole('heading', { name: heading })).not.toBeNull();
    });

    it('should redirect non-admins to the home page', async () => {
        // Render -----------------------------------------------
        renderAs(mockCurrentUser, path);

        // Expect ------------------------------------------------
        expect(await screen.findByLabelText('View Mock Recipe')).not.toBeNull();
        expect(screen.queryByRole('heading', { name: heading })).toBeNull();
    });
});
