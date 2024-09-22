import { userEvent } from '@testing-library/user-event';
import { cleanup, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { loadDevMessages, loadErrorMessages } from '@apollo/client/dev';

import { clickFindByText, clickGetByText } from '@recipe/utils/tests';
import { mockBumpId, mockPostedId } from '@recipe/graphql/__mocks__/ids';
import { mockCreateBespokeUnit } from '@recipe/graphql/mutations/__mocks__/unit';
import { mockDeleteBespokeUnit } from '@recipe/graphql/mutations/__mocks__/unit';
import { mockCreateBespokePrepMethod } from '@recipe/graphql/mutations/__mocks__/prepMethod';
import { mockDeleteBespokePrepMethod } from '@recipe/graphql/mutations/__mocks__/prepMethod';

import { renderComponent } from './utils';

loadErrorMessages();
loadDevMessages();

describe('Deleting bespoke items', () => {
    const consoleMock = vi.spyOn(console, 'log').mockImplementation(() => undefined);

    afterEach(() => {
        cleanup();
        consoleMock.mockReset();
    });

    it('should delete a bespoke unit via click away', async () => {
        const user = userEvent.setup();
        // Render
        renderComponent([mockCreateBespokeUnit, mockDeleteBespokeUnit]);

        // Act
        await user.click(screen.getByText('Enter ingredient'));
        await user.keyboard('{1}{ }{b}{u}{m}{p}');
        await user.click(screen.getByText('use "bump" as unit'));
        await user.click(screen.getByText('decimal'));
        await user.click(screen.getByLabelText('Save unit'));
        await user.click(await screen.findByText('chicken'));
        await user.click(screen.getByLabelText('Enter title for ingredient subsection 1'));

        // Expect --------------------------------------------------------------
        expect(consoleMock).toHaveBeenCalledOnce();
        expect(consoleMock).toHaveBeenLastCalledWith(`Successfully deleted unit ${mockBumpId}`);
    });

    it('should delete a bespoke unit via escape key', async () => {
        const user = userEvent.setup();
        // Render
        renderComponent([mockCreateBespokeUnit, mockDeleteBespokeUnit]);

        // Act
        await user.click(screen.getByText('Enter ingredient'));
        await user.keyboard('{1}{ }{b}{u}{m}{p}');
        await user.click(screen.getByText('use "bump" as unit'));
        await user.click(screen.getByText('decimal'));
        await user.click(screen.getByLabelText('Save unit'));
        await clickFindByText(screen, user, 'chicken');
        await user.keyboard('{Escape}');

        // Expect --------------------------------------------------------------
        expect(consoleMock).toHaveBeenCalledOnce();
        expect(consoleMock).toHaveBeenLastCalledWith(`Successfully deleted unit ${mockBumpId}`);
    });

    it('should delete a bespoke unit via remove finished ingredient', async () => {
        const user = userEvent.setup();
        // Render
        renderComponent([mockCreateBespokeUnit, mockDeleteBespokeUnit]);

        // Act
        await user.click(screen.getByText('Enter ingredient'));
        await user.keyboard('{1}{ }{b}{u}{m}{p}');
        await user.click(screen.getByText('use "bump" as unit'));
        await user.click(screen.getByText('decimal'));
        await user.click(screen.getByLabelText('Save unit'));
        await clickFindByText(screen, user, 'chicken', 'skip prep method');
        await user.click(screen.getByLabelText('Remove 1 bump chicken'));

        // Expect --------------------------------------------------------------
        expect(consoleMock).toHaveBeenCalledOnce();
        expect(consoleMock).toHaveBeenLastCalledWith(`Successfully deleted unit ${mockBumpId}`);
    });

    it('should delete a bespoke unit via remove finished ingredient', async () => {
        const user = userEvent.setup();
        // Render
        renderComponent([mockCreateBespokePrepMethod, mockDeleteBespokePrepMethod]);

        // Act
        await user.click(screen.getByText('Enter ingredient'));
        await user.keyboard('{1}{ }');
        await clickGetByText(screen, user, 'skip unit', 'chicken');
        await user.keyboard('{p}{o}{s}{t}{e}{d}');
        await user.click(screen.getByText('use "posted" as prep method'));
        await user.click(await screen.findByLabelText('Remove 1 chicken, posted'));

        // Expect --------------------------------------------------------------
        expect(consoleMock).toHaveBeenCalledOnce();
        expect(consoleMock).toHaveBeenLastCalledWith(
            `Successfully deleted prep method ${mockPostedId}`
        );
    });
});
