export interface ConfirmActionConfig {
    buttonLabel: string;
    title: string;
    body: string;
    cancelAriaLabel: string;
    confirmAriaLabel: string;
}

export const archiveRecipeConfirmConfig: ConfirmActionConfig = {
    buttonLabel: 'Archive',
    title: 'Archive Recipe',
    body: 'Are you sure you want to archive this recipe? You can restore it later.',
    cancelAriaLabel: 'Cancel archive action',
    confirmAriaLabel: 'Confirm archive action',
};

export const deleteVeganVersionConfirmConfig: ConfirmActionConfig = {
    buttonLabel: 'Delete',
    title: 'Delete Vegan Version',
    body: 'Are you sure you want to delete this vegan version? This cannot be undone.',
    cancelAriaLabel: 'Cancel delete vegan version action',
    confirmAriaLabel: 'Confirm delete vegan version action',
};
