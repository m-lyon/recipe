import { userEvent } from '@testing-library/user-event';
import { cleanup, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { loadDevMessages, loadErrorMessages } from '@apollo/client/dev';

import { enterCreateNewRecipePage, enterViewRecipePage } from '@recipe/utils/tests';
import { haveTextContentByLabelText, haveValueByLabelText, nullByText } from '@recipe/utils/tests';

import { renderComponent } from './utils';

loadErrorMessages();
loadDevMessages();

describe('Update Recipe Workflow: Servings', () => {
    afterEach(() => {
        cleanup();
    });

    it('should convert tbsp into cup fraction', async () => {
        // Render ------------------------------------------------
        renderComponent();
        const user = userEvent.setup();

        // Act ---------------------------------------------------
        await enterCreateNewRecipePage(screen, user);
        await user.click(screen.getByLabelText('Enter ingredient #1 for subsection 1'));
        await user.keyboard('{8}{ }{t}{b}{s}{p}{ }');
        await new Promise((resolve) => setTimeout(resolve, 300));

        // Expect ------------------------------------------------
        nullByText(screen, 'cup', 'cups');
        haveValueByLabelText(screen, 'Input ingredient #1 for subsection 1', '½ cup ');
    });

    it('should correctly convert cups into tbsp', async () => {
        // Render ------------------------------------------------
        renderComponent();
        const user = userEvent.setup();

        // Act ---------------------------------------------------
        await enterCreateNewRecipePage(screen, user);
        await user.click(screen.getByLabelText('Enter ingredient #1 for subsection 1'));
        await user.keyboard('{1}{{/}}{8}{ }{c}{u}{p}{ }');

        // Expect ------------------------------------------------
        expect(await screen.findByText('skip size')).not.toBeNull();
        haveValueByLabelText(screen, 'Input ingredient #1 for subsection 1', '2 tbsp ');
    });

    it('should resolve irrational numbers when decimal is preferred', async () => {
        // Render ------------------------------------------------
        renderComponent();
        const user = userEvent.setup();

        // Act ---------------------------------------------------
        await enterViewRecipePage(screen, user, 'Mock Recipe Two', 'Instruction one.');
        await user.click(screen.getByLabelText('Increase serving size'));

        // Expect ------------------------------------------------
        expect(await screen.findByText('4 Servings')).not.toBeNull();
        haveTextContentByLabelText(screen, 'Ingredient #2 in subsection 2', '1.33 oz apples');
    });
});
