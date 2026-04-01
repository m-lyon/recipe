import { userEvent } from '@testing-library/user-event';
import { afterEach, describe, expect, it } from 'vitest';
import { cleanup, screen, within } from '@testing-library/react';
import { loadDevMessages, loadErrorMessages } from '@apollo/client/dev';

import { PATH } from '@recipe/constants';
import { MockedResponses, renderPage } from '@recipe/utils/tests';
import { enterEditRecipePage, enterViewRecipePage } from '@recipe/utils/tests';
import { mockGetRecipeOneWithTimings } from '@recipe/graphql/queries/__mocks__/recipe';
import { mockUpdateRecipeAddActiveTime } from '@recipe/graphql/mutations/__mocks__/recipe';
import { mockUpdateRecipeAddBothTimings } from '@recipe/graphql/mutations/__mocks__/recipe';
import { mockUpdateRecipeAddPassiveTime } from '@recipe/graphql/mutations/__mocks__/recipe';
import { mockUpdateRecipeRemoveActiveTime } from '@recipe/graphql/mutations/__mocks__/recipe';
import { mockUpdateRecipeUpdateActiveTime } from '@recipe/graphql/mutations/__mocks__/recipe';

import { routes } from '../routes';
import { renderComponent } from './utils';
import { mocks } from '../__mocks__/graphql';

loadErrorMessages();
loadDevMessages();

/**
 * Like renderComponent, but places priorityMocks BEFORE the default mocks
 * so they are consumed first by Apollo MockedProvider.
 */
function renderWithPriorityMocks(priorityMocks: MockedResponses, extraMocks: MockedResponses = []) {
    return renderPage(routes, [...priorityMocks, ...mocks, ...extraMocks], [PATH.ROOT]);
}

function getSelectInput(ariaLabel: string): HTMLInputElement {
    const all = screen.getAllByLabelText(ariaLabel);
    // Mantine Select renders two inputs: a hidden one and a visible one.
    // We want the visible combobox input (role=combobox or type=search).
    const visible = all.find(
        (el) => el.getAttribute('role') === 'combobox' || el.getAttribute('type') === 'search'
    );
    return (visible ?? all[0]) as HTMLInputElement;
}

async function selectMantineOption(
    user: ReturnType<typeof userEvent.setup>,
    ariaLabel: string,
    value: string
) {
    const input = getSelectInput(ariaLabel);
    await user.click(input);
    const listbox = await screen.findByRole('listbox');
    await user.click(within(listbox).getByText(value));
}

describe('Update Recipe Workflow: Timings', () => {
    afterEach(() => {
        cleanup();
    });

    it('should add an active time', async () => {
        // Render -----------------------------------------------
        renderComponent([mockUpdateRecipeAddActiveTime]);
        const user = userEvent.setup();

        // Act --------------------------------------------------
        await enterEditRecipePage(screen, user, 'Mock Recipe', 'Instruction one.');
        await selectMantineOption(user, 'active time hours', '1');
        await selectMantineOption(user, 'active time minutes', '30');
        await user.click(screen.getByLabelText('Save recipe'));

        // Expect ------------------------------------------------
        // ------ View Recipe Page -------------------------------
        await enterViewRecipePage(screen, user, 'Mock Recipe', 'Active: 1 hr 30 min');
    });

    it('should add a passive time', async () => {
        // Render -----------------------------------------------
        renderComponent([mockUpdateRecipeAddPassiveTime]);
        const user = userEvent.setup();

        // Act --------------------------------------------------
        await enterEditRecipePage(screen, user, 'Mock Recipe', 'Instruction one.');
        await selectMantineOption(user, 'passive time hours', '2');
        await selectMantineOption(user, 'passive time minutes', '0');
        await user.click(screen.getByLabelText('Save recipe'));

        // Expect ------------------------------------------------
        // ------ View Recipe Page -------------------------------
        await enterViewRecipePage(screen, user, 'Mock Recipe', 'Passive: 2 hr');
    });

    it('should add both active and passive times', async () => {
        // Render -----------------------------------------------
        renderComponent([mockUpdateRecipeAddBothTimings]);
        const user = userEvent.setup();

        // Act --------------------------------------------------
        await enterEditRecipePage(screen, user, 'Mock Recipe', 'Instruction one.');
        await selectMantineOption(user, 'active time hours', '1');
        await selectMantineOption(user, 'active time minutes', '30');
        await selectMantineOption(user, 'passive time hours', '2');
        await selectMantineOption(user, 'passive time minutes', '0');
        await user.click(screen.getByLabelText('Save recipe'));

        // Expect ------------------------------------------------
        // ------ View Recipe Page -------------------------------
        await enterViewRecipePage(screen, user, 'Mock Recipe', 'Active: 1 hr 30 min');
        expect(screen.getByText('Passive: 2 hr')).not.toBeNull();
    });

    it('should remove an active time', async () => {
        // Render -----------------------------------------------
        // mockGetRecipeOneWithTimings must be consumed BEFORE the default
        // mockGetRecipeOne so the edit page loads the recipe with timings.
        renderWithPriorityMocks([mockGetRecipeOneWithTimings], [mockUpdateRecipeRemoveActiveTime]);
        const user = userEvent.setup();

        // Act --------------------------------------------------
        await enterEditRecipePage(screen, user, 'Mock Recipe', 'Instruction one.');
        // Setting both hours and minutes to 0 triggers onChange(null)
        await selectMantineOption(user, 'active time hours', '0');
        await selectMantineOption(user, 'active time minutes', '0');
        await user.click(screen.getByLabelText('Save recipe'));

        // Expect ------------------------------------------------
        // ------ View Recipe Page -------------------------------
        await enterViewRecipePage(screen, user, 'Mock Recipe', 'Passive: 2 hr');
        expect(screen.queryByText(/Active/)).toBeNull();
    });

    it('should update an active time', async () => {
        // Render -----------------------------------------------
        // mockGetRecipeOneWithTimings must be consumed BEFORE the default
        // mockGetRecipeOne so the edit page loads the recipe with timings.
        renderWithPriorityMocks([mockGetRecipeOneWithTimings], [mockUpdateRecipeUpdateActiveTime]);
        const user = userEvent.setup();

        // Act --------------------------------------------------
        await enterEditRecipePage(screen, user, 'Mock Recipe', 'Instruction one.');
        await selectMantineOption(user, 'active time hours', '0');
        await selectMantineOption(user, 'active time minutes', '45');
        await user.click(screen.getByLabelText('Save recipe'));

        // Expect ------------------------------------------------
        // ------ View Recipe Page -------------------------------
        await enterViewRecipePage(screen, user, 'Mock Recipe', 'Active: 45 min');
    });
});
