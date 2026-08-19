import { userEvent } from '@testing-library/user-event';
import { afterEach, describe, expect, it } from 'vitest';
import { cleanup, screen } from '@testing-library/react';
import { Route, createRoutesFromElements } from 'react-router-dom';
import { loadDevMessages, loadErrorMessages } from '@apollo/client/dev';

import { MockedResponses, renderPage } from '@recipe/utils/tests';
import { mockCurrentUserAdmin } from '@recipe/graphql/queries/__mocks__/user';
import { mockCreateKeyPhrase } from '@recipe/graphql/mutations/__mocks__/keyPhrase';

import { CreateKeyPhrase } from '../CreateKeyPhrase';

loadErrorMessages();
loadDevMessages();

const renderComponent = (mocks: MockedResponses = []) => {
    const routes = createRoutesFromElements(<Route path='/' element={<CreateKeyPhrase />} />);
    return renderPage(routes, [mockCurrentUserAdmin, ...mocks]);
};

describe('Create Key Phrase', () => {
    afterEach(() => {
        cleanup();
    });

    it('should render form with Value and Description fields', async () => {
        renderComponent();

        expect(await screen.findByText('Create Key Phrase')).not.toBeNull();
        expect(screen.getByRole('textbox', { name: /Value/i })).not.toBeNull();
        expect(screen.getByRole('textbox', { name: /Description/i })).not.toBeNull();
        expect(screen.getByLabelText('Save key phrase')).not.toBeNull();
    });

    it('should submit and show success toast', async () => {
        const user = userEvent.setup();
        renderComponent([mockCreateKeyPhrase]);

        expect(await screen.findByText('Create Key Phrase')).not.toBeNull();
        await user.click(screen.getByRole('textbox', { name: /Value/i }));
        await user.keyboard('sear');
        await user.click(screen.getByRole('textbox', { name: /Description/i }));
        await user.keyboard('To cook at high heat until a crust forms.');
        await user.click(screen.getByLabelText('Save key phrase'));

        expect(await screen.findByText('Key phrase saved')).not.toBeNull();
    });

    it('should show validation error when submitting empty form', async () => {
        const user = userEvent.setup();
        renderComponent();

        expect(await screen.findByText('Create Key Phrase')).not.toBeNull();
        await user.click(screen.getByLabelText('Save key phrase'));

        expect(await screen.findByText('Error saving key phrase')).not.toBeNull();
    });
});
