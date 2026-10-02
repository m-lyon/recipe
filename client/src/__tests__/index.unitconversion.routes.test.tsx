import { userEvent } from '@testing-library/user-event';
import { cleanup, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { loadDevMessages, loadErrorMessages } from '@apollo/client/dev';

import { PATH } from '@recipe/constants';
import { renderPage } from '@recipe/utils/tests';
import { CURRENT_USER } from '@recipe/graphql/queries/user';
import { mockGetAllUnits } from '@recipe/graphql/queries/__mocks__/unit';
import { mockCurrentUser, mockCurrentUserAdmin } from '@recipe/graphql/queries/__mocks__/user';

import { routes } from '../routes';
import { mocks } from '../__mocks__/graphql';

loadErrorMessages();
loadDevMessages();

const renderAs = (currentUser: typeof mockCurrentUser, path: string) => {
    const otherMocks = mocks.filter((m) => m.request.query !== CURRENT_USER);
    return renderPage(routes, [currentUser, mockGetAllUnits, ...otherMocks], [path]);
};

// Each page's first select, and an option that only appears once its query has resolved
describe.each([
    ['Create Unit Conversion', `${PATH.BASE}/create/unit-conversion`, 'Base unit', 'ounce'],
    ['Edit Unit Conversion', `${PATH.BASE}/edit/unit-conversion`, 'Select unit conversion', 'gram'],
])('Unit conversion route: %s', (heading, path, selectLabel, optionName) => {
    afterEach(() => {
        cleanup();
    });

    it('should render the page for admins', async () => {
        // Render -----------------------------------------------
        const user = userEvent.setup();
        renderAs(mockCurrentUserAdmin, path);

        // Act --------------------------------------------------
        await user.click(await screen.findByLabelText(selectLabel));

        // Expect ------------------------------------------------
        expect(await screen.findByRole('option', { name: optionName })).not.toBeNull();
        expect(screen.getByRole('heading', { name: heading })).not.toBeNull();
    });

    it('should redirect non-admins to the home page', async () => {
        // Render -----------------------------------------------
        const { router } = renderAs(mockCurrentUser, path);

        // Expect ------------------------------------------------
        expect(await screen.findByLabelText('View Mock Recipe')).not.toBeNull();
        expect(screen.queryByRole('heading', { name: heading })).toBeNull();
        expect(router.state.historyAction).toBe('REPLACE');
    });
});
