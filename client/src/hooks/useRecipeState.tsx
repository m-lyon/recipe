import { useEditableIngredients, UseIngredientListReturnType } from './useIngredientList';
import { useItemList, UseItemListReturnType } from '../hooks/useItemList';
import { useEditable, UseEditableReturnType } from './useEditable';

interface RecipeState {
    ingredientState: UseIngredientListReturnType;
    instructionsState: UseItemListReturnType;
    tagsState: UseItemListReturnType;
    titleState: UseEditableReturnType;
}
export function useRecipeState(): RecipeState {
    const ingredientState = useEditableIngredients();
    const instructionsState = useItemList('Enter instructions...');
    const tagsState = useItemList('Add a tag...');
    const titleState = useEditable('Enter Recipe Title');

    return { ingredientState, instructionsState, tagsState, titleState };
}
