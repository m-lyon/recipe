import { userEvent } from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, screen, waitFor } from '@testing-library/react';
import { loadDevMessages, loadErrorMessages } from '@apollo/client/dev';

import { notNullByText, nullByText } from '@recipe/utils/tests';
import { mockGetRecipeFour } from '@recipe/graphql/queries/__mocks__/recipe';
import { enterEditRecipePage, haveValueByLabelText } from '@recipe/utils/tests';
import { enterCreateNewRecipePage, enterViewRecipePage } from '@recipe/utils/tests';
import { mockGetRatingsRecipeFour } from '@recipe/graphql/queries/__mocks__/rating';
import { mockUpdateAddInstructionSubsection } from '@recipe/graphql/mutations/__mocks__/recipe';
import { mockUpdateEditInstructionSubsection } from '@recipe/graphql/mutations/__mocks__/recipe';
import { mockUpdateRemoveInstructionSubsection } from '@recipe/graphql/mutations/__mocks__/recipe';

import { renderComponent } from './utils';

loadErrorMessages();
loadDevMessages();

describe('Instruction Subsections', () => {
    afterEach(() => {
        cleanup();
    });

    it('should display the instruction subsections', async () => {
        // Render -----------------------------------------------
        renderComponent([mockGetRecipeFour, mockGetRatingsRecipeFour]);
        const user = userEvent.setup();

        // Act --------------------------------------------------
        await enterViewRecipePage(screen, user, 'Mock Recipe Four', 'Instr #1.');

        // Expect
        await notNullByText(screen, 'Instruct One', 'Instruct Two');
    });

    it('should add a new instruction subsection', async () => {
        // Render -----------------------------------------------
        const mockBlob = new Blob(['dummy image data'], { type: 'image/jpeg' });
        global.fetch = vi.fn().mockResolvedValue({ blob: () => Promise.resolve(mockBlob) });
        renderComponent([mockUpdateAddInstructionSubsection]);
        const user = userEvent.setup();

        // Act --------------------------------------------------
        await enterEditRecipePage(screen, user, 'Mock Recipe Two', 'Instruction one');
        await user.click(screen.getByLabelText('Enter title for instruction subsection 2'));
        await user.keyboard('New Section');
        await user.click(screen.getByLabelText('Enter instruction #1 for subsection 2'));
        await user.keyboard('A new instruction.');
        await user.click(screen.getByLabelText('Save recipe'));

        // Expect ------------------------------------------------
        // ------ View Recipe Page -------------------------------
        await enterViewRecipePage(screen, user, 'Mock Recipe Two', 'Instruct One');
        await notNullByText(screen, 'New Section', 'A new instruction.');
        await user.click(screen.getByLabelText('Navigate to home page'));
        // ------ Edit Recipe Page -------------------------------
        await enterEditRecipePage(screen, user, 'Mock Recipe Two', 'Instruction one');
        haveValueByLabelText(screen, 'Enter title for instruction subsection 1', 'Instruct One');
        expect(screen.queryByLabelText('Enter instruction #3 for subsection 1')).not.toBeNull();
        haveValueByLabelText(screen, 'Enter title for instruction subsection 2', 'New Section');
        expect(screen.queryByLabelText('Enter instruction #1 for subsection 2')).not.toBeNull();
        haveValueByLabelText(screen, 'Enter title for instruction subsection 3', '');
        expect(screen.queryByLabelText('Enter instruction #1 for subsection 3')).not.toBeNull();
        await notNullByText(screen, 'Instruction two', 'A new instruction.');
    });

    it('should edit an instruction subsection name', async () => {
        // Render -----------------------------------------------
        renderComponent([mockUpdateEditInstructionSubsection]);
        const user = userEvent.setup();

        // Act --------------------------------------------------
        await enterEditRecipePage(screen, user, 'Mock Recipe Two', 'Instruction one');
        await user.click(screen.getByLabelText('Enter title for instruction subsection 1'));
        await user.keyboard('{Backspace>3/}Four');
        await user.click(screen.getByLabelText('Save recipe'));

        // Expect ------------------------------------------------
        // ------ View Recipe Page -------------------------------
        await enterViewRecipePage(screen, user, 'Mock Recipe Two', 'Instruction one');
        await notNullByText(screen, 'Instruct Four');
        await user.click(screen.getByLabelText('Navigate to home page'));
        // ------ Edit Recipe Page -------------------------------
        await enterEditRecipePage(screen, user, 'Mock Recipe Two', 'Instruction one');
        haveValueByLabelText(screen, 'Enter title for instruction subsection 1', 'Instruct Four');
        expect(screen.queryByLabelText('Enter instruction #3 for subsection 1')).not.toBeNull();
        haveValueByLabelText(screen, 'Enter title for instruction subsection 2', '');
        expect(screen.queryByLabelText('Enter instruction #1 for subsection 2')).not.toBeNull();
        expect(screen.queryByLabelText('Enter title for instruction subsection 3')).toBeNull();
        expect(screen.queryByLabelText('Enter instruction #1 for subsection 3')).toBeNull();
    });

    it('should remove an instruction subsection', async () => {
        // Render -----------------------------------------------
        renderComponent([
            mockGetRecipeFour,
            mockGetRatingsRecipeFour,
            mockUpdateRemoveInstructionSubsection,
        ]);
        const user = userEvent.setup();

        // Act --------------------------------------------------
        await enterEditRecipePage(screen, user, 'Mock Recipe Four', 'Instr #1.');
        await user.click(screen.getByLabelText('Enter title for instruction subsection 2'));
        await user.keyboard('{Backspace>12/}');
        await user.click(screen.getByLabelText('Save recipe'));

        // Expect ------------------------------------------------
        // ------ View Recipe Page -------------------------------
        await enterViewRecipePage(screen, user, 'Mock Recipe Four', 'Instr #1.');
        await notNullByText(screen, 'Instruct One');
        nullByText(screen, 'Instruct Two', 'Instr #3.');
        await user.click(screen.getByLabelText('Navigate to home page'));
        // ------ Edit Recipe Page -------------------------------
        await enterEditRecipePage(screen, user, 'Mock Recipe Four', 'Instr #1.');
        haveValueByLabelText(screen, 'Enter title for instruction subsection 1', 'Instruct One');
        expect(screen.queryByLabelText('Enter instruction #3 for subsection 1')).not.toBeNull();
        haveValueByLabelText(screen, 'Enter title for instruction subsection 2', '');
        expect(screen.queryByLabelText('Enter instruction #1 for subsection 2')).not.toBeNull();
        expect(screen.queryByLabelText('Enter instruction #2 for subsection 2')).toBeNull();
        expect(screen.queryByLabelText('Enter title for instruction subsection 3')).toBeNull();
        expect(screen.queryByLabelText('Enter instruction #1 for subsection 3')).toBeNull();
    });

    it('should add one new empty instruction subsection after writing title and entering', async () => {
        // Render -----------------------------------------------
        renderComponent();
        const user = userEvent.setup();

        // Act --------------------------------------------------
        await enterCreateNewRecipePage(screen, user);
        await user.click(screen.getByLabelText('Enter title for instruction subsection 1'));
        await user.keyboard('New Section{Enter}');

        // Expect ------------------------------------------------
        haveValueByLabelText(screen, 'Enter title for instruction subsection 1', 'New Section');
        expect(screen.queryByLabelText('Enter title for instruction subsection 2')).not.toBeNull();
        expect(screen.queryByLabelText('Enter title for instruction subsection 3')).toBeNull();
    });

    it('should add one new empty instruction subsection after writing title and clicking', async () => {
        // Render -----------------------------------------------
        renderComponent();
        const user = userEvent.setup();

        // Act --------------------------------------------------
        await enterCreateNewRecipePage(screen, user);
        await user.click(screen.getByLabelText('Enter title for instruction subsection 1'));
        await user.keyboard('New Section');
        await user.click(screen.getByLabelText('Enter recipe title'));

        // Expect -----------------------------------------------
        haveValueByLabelText(screen, 'Enter title for instruction subsection 1', 'New Section');
        expect(screen.queryByLabelText('Enter title for instruction subsection 2')).not.toBeNull();
        expect(screen.queryByLabelText('Enter title for instruction subsection 3')).toBeNull();
    });

    it('should have exactly one instruction subsection, with an empty name', async () => {
        // Render -----------------------------------------------
        renderComponent();
        const user = userEvent.setup();

        // Act --------------------------------------------------
        await enterEditRecipePage(screen, user, 'Mock Recipe', 'Instruction one');

        // Expect -----------------------------------------------
        haveValueByLabelText(screen, 'Enter title for instruction subsection 1', '');
        expect(screen.queryByLabelText('Enter title for instruction subsection 2')).toBeNull();
        expect(screen.queryByLabelText('Enter instruction #1 for subsection 2')).toBeNull();
    });

    it('should have exactly two instruction subsections, one empty', async () => {
        // Render -----------------------------------------------
        renderComponent();
        const user = userEvent.setup();

        // Act --------------------------------------------------
        await enterEditRecipePage(screen, user, 'Mock Recipe Two', 'Instruction one');

        // Expect -----------------------------------------------
        haveValueByLabelText(screen, 'Enter title for instruction subsection 1', 'Instruct One');
        haveValueByLabelText(screen, 'Enter title for instruction subsection 2', '');
        expect(screen.queryByLabelText('Enter instruction #1 for subsection 2')).not.toBeNull();
        expect(screen.queryByLabelText('Enter title for instruction subsection 3')).toBeNull();
        expect(screen.queryByLabelText('Enter instruction #1 for subsection 3')).toBeNull();
    });

    it('should have three instruction subsections, one empty', async () => {
        // Render -----------------------------------------------
        renderComponent([mockGetRecipeFour, mockGetRatingsRecipeFour]);
        const user = userEvent.setup();

        // Act --------------------------------------------------
        await enterEditRecipePage(screen, user, 'Mock Recipe Four', 'Instr #1.');

        // Expect -----------------------------------------------
        haveValueByLabelText(screen, 'Enter title for instruction subsection 1', 'Instruct One');
        haveValueByLabelText(screen, 'Enter title for instruction subsection 2', 'Instruct Two');
        expect(screen.queryByLabelText('Enter instruction #1 for subsection 2')).not.toBeNull();
        expect(screen.queryByLabelText('Enter title for instruction subsection 3')).not.toBeNull();
        expect(screen.queryByLabelText('Enter instruction #1 for subsection 3')).not.toBeNull();
        expect(screen.queryByLabelText('Enter title for instruction subsection 4')).toBeNull();
        expect(screen.queryByLabelText('Enter instruction #1 for subsection 4')).toBeNull();
    });

    it('should keep instruction list items after removing only subsection name, enter', async () => {
        // Render -----------------------------------------------
        renderComponent();
        const user = userEvent.setup();

        // Act --------------------------------------------------
        await enterEditRecipePage(screen, user, 'Mock Recipe Two', 'Instruction one');
        await user.click(screen.getByLabelText('Enter title for instruction subsection 1'));
        await user.keyboard('{Backspace>12/}{Enter}');

        // Expect -----------------------------------------------
        haveValueByLabelText(screen, 'Enter title for instruction subsection 1', '');
        expect(screen.queryByLabelText('Enter title for instruction subsection 2')).toBeNull();
        expect(screen.queryByLabelText('Enter instruction #1 for subsection 2')).toBeNull();
        expect(screen.queryByLabelText('Enter title for instruction subsection 3')).toBeNull();
        expect(screen.queryByLabelText('Enter instruction #1 for subsection 3')).toBeNull();
    });

    it('should keep instruction list items after removing only subsection name, click', async () => {
        // Render -----------------------------------------------
        renderComponent();
        const user = userEvent.setup();

        // Act --------------------------------------------------
        await enterEditRecipePage(screen, user, 'Mock Recipe Two', 'Instruction one');
        await user.click(screen.getByLabelText('Enter title for instruction subsection 1'));
        await user.keyboard('{Backspace>12/}');
        await user.click(screen.getByLabelText('Enter recipe title'));

        // Expect -----------------------------------------------
        haveValueByLabelText(screen, 'Enter title for instruction subsection 1', '');
        expect(screen.queryByLabelText('Enter title for instruction subsection 2')).toBeNull();
        expect(screen.queryByLabelText('Enter instruction #1 for subsection 2')).toBeNull();
        expect(screen.queryByLabelText('Enter title for instruction subsection 3')).toBeNull();
        expect(screen.queryByLabelText('Enter instruction #1 for subsection 3')).toBeNull();
    });

    it('should delete instruction list items after removing first subsection name, enter', async () => {
        // Render -----------------------------------------------
        renderComponent([mockGetRecipeFour, mockGetRatingsRecipeFour]);
        const user = userEvent.setup();

        // Act --------------------------------------------------
        await enterEditRecipePage(screen, user, 'Mock Recipe Four', 'Instr #1.');
        await user.click(screen.getByLabelText('Enter title for instruction subsection 1'));
        await user.keyboard('{Backspace>12/}{Enter}');

        // Expect -----------------------------------------------
        haveValueByLabelText(screen, 'Enter title for instruction subsection 1', 'Instruct Two');
        expect(screen.queryByLabelText('Enter title for instruction subsection 2')).not.toBeNull();
        expect(screen.queryByLabelText('Enter instruction #1 for subsection 2')).not.toBeNull();
        expect(screen.queryByLabelText('Enter title for instruction subsection 3')).toBeNull();
        expect(screen.queryByLabelText('Enter instruction #1 for subsection 3')).toBeNull();
        nullByText(screen, 'Instr #1.', 'Instr #2.');
        await notNullByText(screen, 'Instr #3.');
    });

    it('should delete ingredient list items after removing first subsection name, click', async () => {
        // Render -----------------------------------------------
        renderComponent([mockGetRecipeFour, mockGetRatingsRecipeFour]);
        const user = userEvent.setup();

        // Act --------------------------------------------------
        await enterEditRecipePage(screen, user, 'Mock Recipe Four', 'Instr #1.');
        await user.click(screen.getByLabelText('Enter title for instruction subsection 1'));
        await user.keyboard('{Backspace>12/}');
        await user.click(screen.getByLabelText('Enter recipe title'));

        // Expect -----------------------------------------------
        haveValueByLabelText(screen, 'Enter title for instruction subsection 1', 'Instruct Two');
        expect(screen.queryByLabelText('Enter title for instruction subsection 2')).not.toBeNull();
        expect(screen.queryByLabelText('Enter instruction #1 for subsection 2')).not.toBeNull();
        expect(screen.queryByLabelText('Enter title for instruction subsection 3')).toBeNull();
        expect(screen.queryByLabelText('Enter instruction #1 for subsection 3')).toBeNull();
        nullByText(screen, 'Instr #1.', 'Instr #2.');
        await notNullByText(screen, 'Instr #3.');
    });

    it('should stop recipe submission if there is a second non-named instruction subsection', async () => {
        // Render -----------------------------------------------
        renderComponent();
        const user = userEvent.setup();

        // Act --------------------------------------------------
        await enterEditRecipePage(screen, user, 'Mock Recipe Two', 'Instruction one');
        await user.click(screen.getByLabelText('Enter instruction #1 for subsection 2'));
        await user.keyboard('This is an instruction');
        await user.click(screen.getByLabelText('Save recipe'));

        // Expect -----------------------------------------------
        await waitFor(() =>
            expect(
                screen.queryByText('Please enter a name for each instruction subsection')
            ).not.toBeNull()
        );
    });

    it('should stop recipe submission if there is a second named instruction subsection with no instructions', async () => {
        // Render -----------------------------------------------
        renderComponent();
        const user = userEvent.setup();

        // Act --------------------------------------------------
        await enterEditRecipePage(screen, user, 'Mock Recipe Two', 'Instruction one');
        await user.click(screen.getByLabelText('Enter title for instruction subsection 2'));
        await user.keyboard('Title Two');
        await user.click(screen.getByLabelText('Save recipe'));

        // Expect -----------------------------------------------
        await waitFor(() =>
            expect(
                screen.queryByText('Please enter at least one instruction for each subsection')
            ).not.toBeNull()
        );
    });
});
