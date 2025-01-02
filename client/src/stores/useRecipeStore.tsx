import { StateCreator, create } from 'zustand';

import { TagsSlice, createTagsSlice } from './createTagsSlice';
import { TitleSlice, createTitleSlice } from './createTitleSlice';
import { NotesSlice, createNotesSlice } from './createNotesSlice';
import { SourceSlice, createSourceSlice } from './createSourceSlice';
import { NumServingsSlice, createNumServingsSlice } from './createNumServingsSlice';
import { AsIngredientSlice, createAsIngredientSlice } from './createAsIngredientSlice';
import { IngredientSectionsSlice, createIngredientsSlice } from './createIngredientsSlice';
import { InstructionSectionsSlice, createInstructionsSlice } from './createInstructionsSlice';

interface SharedSlice {
    resetRecipe: () => void;
}
type PartialRecipeState = NotesSlice &
    SourceSlice &
    TitleSlice &
    TagsSlice &
    AsIngredientSlice &
    NumServingsSlice &
    InstructionSectionsSlice &
    IngredientSectionsSlice;
export type RecipeState = PartialRecipeState & SharedSlice;

const createSharedSlice: StateCreator<PartialRecipeState, [], [], SharedSlice> = (_set, get) => ({
    resetRecipe: () => {
        get().resetTitle();
        get().resetNotes();
        get().resetSource();
        get().resetAsIngredient();
        get().resetNumServings();
        get().resetTags();
        get().resetInstructions();
        get().resetIngredients();
    },
});

export const useRecipeStore = create<RecipeState>()((...a) => ({
    ...createNotesSlice(...a),
    ...createSourceSlice(...a),
    ...createTitleSlice(...a),
    ...createAsIngredientSlice(...a),
    ...createNumServingsSlice(...a),
    ...createTagsSlice(...a),
    ...createInstructionsSlice(...a),
    ...createIngredientsSlice(...a),
    ...createSharedSlice(...a),
}));
