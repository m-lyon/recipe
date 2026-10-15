import { userEvent } from '@testing-library/user-event';
import { afterEach, describe, expect, it } from 'vitest';
import { act, cleanup, screen, waitFor } from '@testing-library/react';
import { loadDevMessages, loadErrorMessages } from '@apollo/client/dev';

import { PATH } from '@recipe/constants';
import { renderPage } from '@recipe/utils/tests';
import { mockGetUnits } from '@recipe/graphql/queries/__mocks__/unit';
import { mockCurrentUserAdmin } from '@recipe/graphql/queries/__mocks__/user';
import { mockGetDisplayLadders } from '@recipe/graphql/queries/__mocks__/displayLadder';

import { routes } from '../../routes';

loadErrorMessages();
loadDevMessages();

describe('Display Ladders', () => {
    afterEach(() => {
        cleanup();
    });

    it('should open create with an empty form after a ladder was selected in edit', async () => {
        // Render
        const user = userEvent.setup();
        const { router } = renderPage(
            routes,
            [mockCurrentUserAdmin, mockGetUnits, mockGetDisplayLadders],
            [`${PATH.BASE}/edit/display-ladder`]
        );

        // Act -- select a ladder in edit, then go to create
        expect(await screen.findByText('Edit Display Ladder')).not.toBeNull();
        await user.click(screen.getByLabelText('Select display ladder'));
        await user.click(await screen.findByRole('option', { name: 'metric-mass' }));
        await waitFor(() =>
            expect(screen.getByLabelText('Name')).toHaveProperty('value', 'metric-mass')
        );
        await act(() => router.navigate(`${PATH.BASE}/create/display-ladder`));

        // Expect
        expect(await screen.findByText('Create Display Ladder')).not.toBeNull();
        expect(screen.getByLabelText('Name')).toHaveProperty('value', '');
        expect(screen.getAllByLabelText(/^Step \d+ unit$/)).toHaveLength(1);
        expect(screen.queryByLabelText('Delete display ladder')).toBeNull();
    });
});
