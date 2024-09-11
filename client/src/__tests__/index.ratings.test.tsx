import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it } from 'vitest';
import { cleanup, screen } from '@testing-library/react';
import { loadDevMessages, loadErrorMessages } from '@apollo/client/dev';

import { enterEditRecipePage } from '@recipe/utils/tests';
import { mockUpdateRecipeOne } from '@recipe/graphql/mutations/__mocks__/recipe';
import { mockAddRatingRecipeOne } from '@recipe/graphql/mutations/__mocks__/rating';

import { renderComponent } from './utils';

loadErrorMessages();
loadDevMessages();

describe('Update Recipe Workflow: Rating', () => {
    const originalGetBoundingClientRect = window.HTMLElement.prototype.getBoundingClientRect;

    afterEach(() => {
        cleanup();
        window.HTMLElement.prototype.getBoundingClientRect = originalGetBoundingClientRect;
    });

    it('should add a rating', async () => {
        // Render -----------------------------------------------
        renderComponent([mockAddRatingRecipeOne, mockUpdateRecipeOne]);
        const user = userEvent.setup();
        window.HTMLElement.prototype.getBoundingClientRect = () =>
            ({ width: 100, left: 0, right: 100 }) as DOMRect;

        // Act --------------------------------------------------
        await enterEditRecipePage('Mock Recipe', 'Instruction one', screen, user);
        const starContainer = screen.getByRole('rating').querySelector('.react-simple-star-rating');
        const svgStar = screen.getAllByLabelText('Select star rating')[3];
        await userEvent.pointer({ target: svgStar, coords: { clientX: 30 } });
        expect(starContainer).not.toBeNull();
        await user.click(starContainer! satisfies Element as Element);
        await user.click(screen.getByLabelText('Save recipe'));

        // Expect ------------------------------------------------
        // ------ Home Page --------------------------------------
        expect(await screen.findByText('Recipes')).not.toBeNull();
        // ------ View Recipe Page -------------------------------
        await user.click(screen.getByLabelText('View Mock Recipe'));
        expect(await screen.findByText('Instruction one')).not.toBeNull();
        expect(screen.getByRole('rating').querySelector('.filled-icons')).toHaveProperty(
            'title',
            '2.25 out of 5'
        );
        await user.click(screen.getByLabelText('Navigate to home page'));
        // ------ Edit Recipe Page -------------------------------
        await enterEditRecipePage('Mock Recipe', 'Instruction one', screen, user);
        expect(screen.getByRole('rating').querySelector('.filled-icons')).toHaveProperty(
            'title',
            '2.25 out of 5'
        );
    });

    it('should add a rating without saving', async () => {
        // Render -----------------------------------------------
        renderComponent([mockAddRatingRecipeOne, mockUpdateRecipeOne]);
        const user = userEvent.setup();
        window.HTMLElement.prototype.getBoundingClientRect = () =>
            ({ width: 100, left: 0, right: 100 }) as DOMRect;

        // Act --------------------------------------------------
        await enterEditRecipePage('Mock Recipe', 'Instruction one', screen, user);
        const starContainer = screen.getByRole('rating').querySelector('.react-simple-star-rating');
        const svgStar = screen.getAllByLabelText('Select star rating')[3];
        await userEvent.pointer({ target: svgStar, coords: { clientX: 30 } });
        expect(starContainer).not.toBeNull();
        await user.click(starContainer! satisfies Element as Element);
        await user.click(screen.getByLabelText('Navigate to home page'));

        // Expect ------------------------------------------------
        // ------ Home Page --------------------------------------
        expect(await screen.findByText('Recipes')).not.toBeNull();
        // ------ View Recipe Page -------------------------------
        await user.click(screen.getByLabelText('View Mock Recipe'));
        expect(await screen.findByText('Instruction one')).not.toBeNull();
        expect(screen.getByRole('rating').querySelector('.filled-icons')).toHaveProperty(
            'title',
            '2.25 out of 5'
        );
        await user.click(screen.getByLabelText('Navigate to home page'));
        // ------ Edit Recipe Page -------------------------------
        await enterEditRecipePage('Mock Recipe', 'Instruction one', screen, user);
        expect(screen.getByRole('rating').querySelector('.filled-icons')).toHaveProperty(
            'title',
            '2.25 out of 5'
        );
    });
});

describe('View Recipe Workflow: Rating', () => {
    const originalGetBoundingClientRect = window.HTMLElement.prototype.getBoundingClientRect;

    afterEach(() => {
        cleanup();
        window.HTMLElement.prototype.getBoundingClientRect = originalGetBoundingClientRect;
    });

    it('should add a rating', async () => {
        // Render -----------------------------------------------
        renderComponent([mockAddRatingRecipeOne, mockUpdateRecipeOne]);
        const user = userEvent.setup();
        window.HTMLElement.prototype.getBoundingClientRect = () =>
            ({ width: 100, left: 0, right: 100 }) as DOMRect;

        // Act --------------------------------------------------
        await user.click(await screen.findByLabelText('View Mock Recipe'));
        expect(await screen.findByText('Instruction one')).not.toBeNull();
        const starContainer = screen.getByRole('rating').querySelector('.react-simple-star-rating');
        const svgStar = screen.getAllByLabelText('Select star rating')[3];
        await userEvent.pointer({ target: svgStar, coords: { clientX: 30 } });
        expect(starContainer).not.toBeNull();
        await user.click(starContainer! satisfies Element as Element);
        await user.click(screen.getByLabelText('Navigate to home page'));

        // Expect ------------------------------------------------
        // ------ Home Page --------------------------------------
        expect(await screen.findByText('Recipes')).not.toBeNull();
        // ------ View Recipe Page -------------------------------
        await user.click(screen.getByLabelText('View Mock Recipe'));
        expect(await screen.findByText('Instruction one')).not.toBeNull();
        expect(screen.getByRole('rating').querySelector('.filled-icons')).toHaveProperty(
            'title',
            '2.25 out of 5'
        );
        await user.click(screen.getByLabelText('Navigate to home page'));
        // ------ Edit Recipe Page -------------------------------
        await enterEditRecipePage('Mock Recipe', 'Instruction one', screen, user);
        expect(screen.getByRole('rating').querySelector('.filled-icons')).toHaveProperty(
            'title',
            '2.25 out of 5'
        );
    });
});
