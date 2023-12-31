import { useIngredientList, UseIngredientListReturnType } from './useIngredientList';
import { useItemList, UseItemListReturnType } from './useItemList';
import { useEditable, UseEditableReturnType } from './useEditable';
import { useTagList, UseTagListReturnType } from './useTagList';
import { ServingsProps } from '../../../components/Servings';
import { useState } from 'react';
import { EditableSourceProps } from '../components/EditableSource';
import { useAsIngredient } from './useAsIngredient';
import { UseAsIngredientReturnType } from './useAsIngredient';

interface RecipeState {
    numServings: ServingsProps;
    ingredient: UseIngredientListReturnType;
    notes: UseEditableReturnType;
    instructions: UseItemListReturnType;
    tags: UseTagListReturnType;
    title: UseEditableReturnType;
    source: EditableSourceProps;
    asIngredient: UseAsIngredientReturnType;
}
export function useRecipeState(): RecipeState {
    const [numServings, setNumServings] = useState<number>(1);
    const ingredient = useIngredientList();
    const instructions = useItemList();
    const tags = useTagList();
    const title = useEditable('Enter Recipe Title');
    const notes = useEditable('Enter Notes...', true);
    const [source, setSource] = useState<string>('');
    const asIngredient = useAsIngredient();

    return {
        numServings: { num: numServings, setNum: setNumServings },
        ingredient,
        notes,
        instructions,
        tags,
        title,
        source: { source, setSource },
        asIngredient,
    };
}
