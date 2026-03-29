import { userEvent } from '@testing-library/user-event';
import { afterEach, describe, expect, it } from 'vitest';
import { cleanup, screen } from '@testing-library/react';
import { Route, createRoutesFromElements } from 'react-router-dom';
import { loadDevMessages, loadErrorMessages } from '@apollo/client/dev';

import { MockedResponses, renderPage } from '@recipe/utils/tests';
import { mockCurrentUserAdmin } from '@recipe/graphql/queries/__mocks__/user';
import { mockGetKeyPhrases } from '@recipe/graphql/queries/__mocks__/keyPhrase';
import {
    mockUpdateKeyPhrase,
    mockDeleteKeyPhrase,
    mockKeyPhraseUsedInRecipes,
    mockKeyPhraseNotUsedInRecipes,
} from '@recipe/graphql/mutations/__mocks__/keyPhrase';

import { EditKeyPhrase } from '../EditKeyPhrase';

loadErrorMessages();
loadDevMessages();

const renderComponent = (mocks: MockedResponses = []) => {
    const routes = createRoutesFromElements(<Route path='/' element={<EditKeyPhrase />} />);
    return renderPage(routes, [mockGetKeyPhrases, mockCurrentUserAdmin, ...mocks]);
};

describe('Edit Key Phrase', () => {
    afterEach(() => {
        cleanup();
    });

    it('should render searchable select with existing key phrases', async () => {
        const user = userEvent.setup();
        renderComponent();

        expect(await screen.findByText('Edit Key Phrase')).not.toBeNull();
        await user.click(screen.getByLabelText('Select key phrase'));
        expect(await screen.findByRole('option', { name: 'sear' })).not.toBeNull();
        expect(await screen.findByRole('option', { name: 'blanch' })).not.toBeNull();
    });

    it('should populate form when selecting a key phrase', async () => {
        const user = userEvent.setup();
        renderComponent();

        expect(await screen.findByText('Edit Key Phrase')).not.toBeNull();
        await user.click(screen.getByLabelText('Select key phrase'));
        await user.click(await screen.findByRole('option', { name: 'sear' }));

        expect(screen.getByRole('textbox', { name: /Value/i })).toHaveProperty('value', 'sear');
        expect(screen.getByRole('textbox', { name: /Description/i })).toHaveProperty(
            'value',
            'To cook at high heat until a crust forms.'
        );
    });

    it('should update a key phrase', async () => {
        const user = userEvent.setup();
        renderComponent([mockUpdateKeyPhrase]);

        expect(await screen.findByText('Edit Key Phrase')).not.toBeNull();
        await user.click(screen.getByLabelText('Select key phrase'));
        await user.click(await screen.findByRole('option', { name: 'sear' }));

        // Clear and type new value
        await user.tripleClick(screen.getByRole('textbox', { name: /Value/i }));
        await user.keyboard('seared');
        await user.tripleClick(screen.getByRole('textbox', { name: /Description/i }));
        await user.keyboard('Updated description.');
        await user.click(screen.getByLabelText('Save key phrase'));

        expect(await screen.findByText('Key phrase saved')).not.toBeNull();
    });

    it('should show simple confirmation when deleting unused key phrase', async () => {
        const user = userEvent.setup();
        renderComponent([mockKeyPhraseNotUsedInRecipes, mockDeleteKeyPhrase]);

        expect(await screen.findByText('Edit Key Phrase')).not.toBeNull();
        await user.click(screen.getByLabelText('Select key phrase'));
        await user.click(await screen.findByRole('option', { name: 'sear' }));
        await user.click(screen.getByLabelText('Delete key phrase'));

        expect(
            await screen.findByText('Are you sure you want to delete this key phrase?')
        ).not.toBeNull();
    });

    it('should show warning when deleting key phrase used in recipes', async () => {
        const user = userEvent.setup();
        renderComponent([mockKeyPhraseUsedInRecipes, mockDeleteKeyPhrase]);

        expect(await screen.findByText('Edit Key Phrase')).not.toBeNull();
        await user.click(screen.getByLabelText('Select key phrase'));
        await user.click(await screen.findByRole('option', { name: 'sear' }));
        await user.click(screen.getByLabelText('Delete key phrase'));

        expect(
            await screen.findByText(
                'This key phrase is currently used in existing recipes. Are you sure you want to delete it?'
            )
        ).not.toBeNull();
    });

    it('should delete key phrase and clear selection on confirm', async () => {
        const user = userEvent.setup();
        renderComponent([mockKeyPhraseNotUsedInRecipes, mockDeleteKeyPhrase]);

        expect(await screen.findByText('Edit Key Phrase')).not.toBeNull();
        await user.click(screen.getByLabelText('Select key phrase'));
        await user.click(await screen.findByRole('option', { name: 'sear' }));
        await user.click(screen.getByLabelText('Delete key phrase'));

        expect(
            await screen.findByText('Are you sure you want to delete this key phrase?')
        ).not.toBeNull();

        // Click the Delete button in the modal
        const modalDeleteButtons = screen.getAllByRole('button', { name: /delete/i });
        const confirmButton = modalDeleteButtons.find(
            (btn) => btn.textContent === 'Delete' && btn !== screen.getByLabelText('Delete key phrase')
        );
        expect(confirmButton).toBeDefined();
        await user.click(confirmButton!);

        expect(await screen.findByText('Key phrase deleted')).not.toBeNull();
    });
});
