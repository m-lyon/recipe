import { useIngredientList, UseIngredientListReturnType } from './useIngredientList';
import { useItemList, UseItemListReturnType } from './useItemList';
import { useEditable, UseEditableReturnType } from './useEditable';
import { useTagList, UseTagListReturnType } from './useTagList';

interface RecipeState {
    ingredientState: UseIngredientListReturnType;
    instructionsState: UseItemListReturnType;
    tagsState: UseTagListReturnType;
    titleState: UseEditableReturnType;
}
export function useRecipeState(): RecipeState {
    const ingredientState = useIngredientList();
    const instructionsState = useItemList('Enter instructions...');
    const tagsState = useTagList();
    const titleState = useEditable('Enter Recipe Title');

    return { ingredientState, instructionsState, tagsState, titleState };
}
