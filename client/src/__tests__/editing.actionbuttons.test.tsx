import { Button } from '@chakra-ui/react';
import { afterEach, describe, expect, it } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';

import { RecipeActionButtons, archiveRecipeConfirmConfig } from '@recipe/features/editing';

afterEach(() => {
    cleanup();
});

describe('RecipeActionButtons', () => {
    it('should render a wrapping action bar for small viewports', () => {
        render(
            <RecipeActionButtons>
                <Button>Archive recipe</Button>
                <Button>Save</Button>
            </RecipeActionButtons>
        );

        const actionBar = screen.getByTestId('recipe-action-buttons');
        const actionItems = screen.getAllByTestId('recipe-action-button-item');

        expect(actionBar).toHaveStyle({ flexWrap: 'wrap' });
        expect(actionBar).toHaveStyle({ width: 'min(calc(100vw - 2rem), 32rem)' });
        expect(actionItems).toHaveLength(2);
        expect(actionItems[0]).toHaveStyle({ flex: '1 1 14rem' });
        expect(actionItems[1]).toHaveStyle({ flex: '1 1 14rem' });
    });

    it('should not render an empty slot when only the save button is present', () => {
        render(
            <RecipeActionButtons>
                {null}
                <Button>Save</Button>
            </RecipeActionButtons>
        );

        const saveButton = screen.getByRole('button', { name: 'Save' });
        const actionItems = screen.getAllByTestId('recipe-action-button-item');

        expect(saveButton).not.toBeNull();
        expect(actionItems).toHaveLength(1);
        expect(actionItems[0]).toHaveStyle({ flex: '0 0 auto' });
        expect(actionItems[0]).toHaveStyle({ justifyContent: 'center' });
    });

    it('should not render an empty slot when a conditional child resolves to false', () => {
        render(
            <RecipeActionButtons>
                {false}
                <Button>Save</Button>
            </RecipeActionButtons>
        );

        const saveButton = screen.getByRole('button', { name: 'Save' });
        const actionItems = screen.getAllByTestId('recipe-action-button-item');

        expect(saveButton).not.toBeNull();
        expect(actionItems).toHaveLength(1);
        expect(actionItems[0]).toHaveStyle({ flex: '0 0 auto' });
        expect(actionItems[0]).toHaveStyle({ justifyContent: 'center' });
    });
});

describe('archiveRecipeConfirmConfig', () => {
    it('should expose the shared archive action copy', () => {
        expect(archiveRecipeConfirmConfig).toEqual({
            buttonLabel: 'Archive recipe',
            title: 'Archive Recipe',
            body: 'Are you sure you want to archive this recipe? You can restore it later.',
            cancelAriaLabel: 'Cancel archive action',
            confirmAriaLabel: 'Confirm archive action',
        });
    });
});
