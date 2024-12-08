import createFetchMock from 'vitest-fetch-mock';
import { userEvent } from '@testing-library/user-event';
import { cleanup, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { loadDevMessages, loadErrorMessages } from '@apollo/client/dev';

import { mockImageFileOne } from '@recipe/graphql/mutations/__mocks__/image';
import { mockUpdateRecipeOne } from '@recipe/graphql/mutations/__mocks__/recipe';
import { mockUpdateRecipeTwo } from '@recipe/graphql/mutations/__mocks__/recipe';
import { mockDeleteImages, mockUploadImages } from '@recipe/graphql/mutations/__mocks__/image';
import { enterEditRecipePage, enterViewRecipePage, getMockedImageBlob } from '@recipe/utils/tests';

import { renderComponent } from './utils';

const fetchMocker = createFetchMock(vi);
fetchMocker.enableMocks();

loadErrorMessages();
loadDevMessages();

describe('Update Image Workflow', () => {
    afterEach(() => {
        cleanup();
        vi.clearAllMocks();
    });

    it('should add an image', async () => {
        // Render -----------------------------------------------
        fetchMock.mockResponseOnce(getMockedImageBlob());
        renderComponent([mockUpdateRecipeOne, mockUploadImages]);
        const user = userEvent.setup();

        // Act --------------------------------------------------
        await enterEditRecipePage(screen, user, 'Mock Recipe', 'Instruction one.');
        user.upload(screen.getByLabelText('Upload image'), mockImageFileOne);
        await user.click(screen.getByLabelText('Save recipe'));

        // Expect ------------------------------------------------
        // ------ Home Page --------------------------------------
        expect(await screen.findByText('Recipes')).not.toBeNull();
        expect(screen.queryByLabelText('Loading image 1 for Mock Recipe')).not.toBeNull();
        // ------ View Recipe Page -------------------------------
        await enterViewRecipePage(screen, user, 'Mock Recipe', 'Instruction one.');
        expect(screen.queryAllByAltText('Image 1 for Mock Recipe')).not.toBeNull();
        await user.click(screen.getByLabelText('Navigate to home page'));
        // ------ Edit Recipe Page -------------------------------
        await enterEditRecipePage(screen, user, 'Mock Recipe', 'Instruction one.');
        expect(screen.queryByAltText('test_image.png')).not.toBeNull();
    });

    it('should remove an image', async () => {
        // Render -----------------------------------------------
        fetchMock.mockResponseOnce(getMockedImageBlob());
        renderComponent([mockUpdateRecipeTwo, mockDeleteImages]);
        const user = userEvent.setup();

        // Act --------------------------------------------------
        await enterEditRecipePage(screen, user, 'Mock Recipe Two', 'Instruction one.');
        await user.click(screen.getByLabelText('Remove test_image.png'));
        await user.click(screen.getByLabelText('Save recipe'));

        // Expect ------------------------------------------------
        // ------ Home Page --------------------------------------
        expect(await screen.findByText('Recipes')).not.toBeNull();
        expect(screen.queryByAltText('Image 1 for Mock Recipe Two')).toBeNull();
        // ------ View Recipe Page -------------------------------
        await enterViewRecipePage(screen, user, 'Mock Recipe Two', 'Instruction one.');
        expect(screen.queryByAltText('Image 1 for Mock Recipe Two')).toBeNull();
        await user.click(screen.getByLabelText('Navigate to home page'));
        // ------ Edit Recipe Page -------------------------------
        await enterEditRecipePage(screen, user, 'Mock Recipe Two', 'Instruction one.');
        expect(screen.queryByAltText('test_image.png')).toBeNull();
    });
});
