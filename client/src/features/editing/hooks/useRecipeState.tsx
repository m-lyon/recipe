import { useState } from 'react';

import { useAsIngredient } from './useAsIngredient';
import { ServingsProps } from '../../../components/Servings';
import { ImageUploadProps } from '../components/ImageUpload';
import { UseAsIngredientReturnType } from './useAsIngredient';
import { UseTagListReturnType, useTagList } from '../../tags/hooks/useTagList';
import { EditableNotesProps } from '../components/EditableNotes';
import { UseItemListReturnType, useItemList } from '../../../common/hooks/useItemList';
import { UseEditableReturnType, useEditable } from '../../../common/hooks/useEditable';
import { EditableSourceProps } from '../components/EditableSource';
import {
    UseIngredientListReturnType,
    useIngredientList,
} from '../../recipeIngredient/hooks/useIngredientList';

export interface RecipeState {
    numServings: ServingsProps;
    ingredient: UseIngredientListReturnType;
    notes: EditableNotesProps;
    instructions: UseItemListReturnType;
    tags: UseTagListReturnType;
    title: UseEditableReturnType;
    source: EditableSourceProps;
    asIngredient: UseAsIngredientReturnType;
    images: ImageUploadProps;
}
export function useRecipeState(): RecipeState {
    const [numServings, setNumServings] = useState<number>(1);
    const ingredient = useIngredientList();
    const instructions = useItemList();
    const tags = useTagList();
    const title = useEditable('Enter Recipe Title');
    const [notes, setNotes] = useState<string>('');
    const [source, setSource] = useState<string>('');
    const asIngredient = useAsIngredient();
    const [images, setImages] = useState<File[]>([]);

    return {
        numServings: { num: numServings, setNum: setNumServings },
        ingredient,
        notes: { notes, setNotes },
        instructions,
        tags,
        title,
        source: { source, setSource },
        asIngredient,
        images: { images, setImages },
    };
}
