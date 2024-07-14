import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it } from 'vitest';
import { cleanup, screen } from '@testing-library/react';
import { loadDevMessages, loadErrorMessages } from '@apollo/client/dev';

import { renderComponent } from './utils';

loadErrorMessages();
loadDevMessages();

describe('Home Page', () => {
    afterEach(() => {
        cleanup();
    });
    it('should load the home page', async () => {
        // Render -----------------------------------------------
        renderComponent();

        // Expect ------------------------------------------------
        expect(await screen.findByText('Recipes')).not.toBeNull();
    });
});

describe('View Recipe Workflow', () => {
    afterEach(() => {
        cleanup();
    });

    it('should navigate to the view recipe page', async () => {
        // Render -----------------------------------------------
        renderComponent();

        // Act --------------------------------------------------
        const recipe = await screen.findByLabelText('View Mock Recipe');
        await userEvent.click(recipe);

        // Expect ------------------------------------------------
        expect(await screen.findByText('Instruction one')).not.toBeNull();
    });
});

describe('Update Recipe Workflow', () => {
    afterEach(() => {
        cleanup();
    });

    it('should navigate to the edit recipe page', async () => {
        // Render -----------------------------------------------
        renderComponent();
        const user = userEvent.setup();

        // Act --------------------------------------------------
        const recipe = await screen.findByLabelText('View Mock Recipe');
        await user.hover(recipe);
        await user.click(screen.getByLabelText('Edit Mock Recipe'));

        // Expect ------------------------------------------------
        expect(await screen.findByText('Instruction one')).not.toBeNull();
    });
});

describe('Create Recipe Workflow', () => {
    afterEach(() => {
        cleanup();
    });

    it('should navigate to the create recipe page', async () => {
        // Render -----------------------------------------------
        renderComponent();
        const user = userEvent.setup();

        // Act --------------------------------------------------
        expect(await screen.findByText('Recipes'));
        expect(await screen.findByText('Logout'));
        await user.click(screen.getAllByLabelText('Create new recipe')[0]);

        // Expect ------------------------------------------------
        expect(await screen.findByText('Ingredients')).not.toBeNull();
    });
});
