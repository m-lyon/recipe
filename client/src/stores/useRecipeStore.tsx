import { StateCreator, create } from 'zustand';

import { TagsSlice, createTagsSlice } from './createTagsSlice';
import { TitleSlice, createTitleSlice } from './createTitleSlice';
import { NotesSlice, createNotesSlice } from './createNotesSlice';
import { SourceSlice, createSourceSlice } from './createSourceSlice';
import { NumServingsSlice, createNumServingsSlice } from './createNumServingsSlice';
import { AsIngredientSlice, createAsIngredientSlice } from './createAsIngredientSlice';

interface SharedSlice {
    resetRecipe: () => void;
}
type PartialRecipeState = NotesSlice &
    SourceSlice &
    TitleSlice &
    TagsSlice &
    AsIngredientSlice &
    NumServingsSlice;
export type RecipeState = PartialRecipeState & SharedSlice;

const createSharedSlice: StateCreator<PartialRecipeState, [], [], SharedSlice> = (_set, get) => ({
    resetRecipe: () => {
        get().resetTitle();
        get().resetNotes();
        get().resetSource();
        get().resetAsIngredient();
        get().resetNumServings();
        get().resetTags();
    },
});

export const useRecipeStore = create<RecipeState>()((...a) => ({
    ...createNotesSlice(...a),
    ...createSourceSlice(...a),
    ...createTitleSlice(...a),
    ...createAsIngredientSlice(...a),
    ...createSharedSlice(...a),
    ...createNumServingsSlice(...a),
    ...createTagsSlice(...a),
}));
