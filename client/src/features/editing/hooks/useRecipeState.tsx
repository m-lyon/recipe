import { useState } from 'react';

import { ServingsProps } from '@recipe/features/servings';
import { UseTagListReturnType, useTagList } from '@recipe/features/tags';
import { UseItemListReturnType, useItemList } from '@recipe/common/hooks';
import { UseEditableReturnType, useEditable } from '@recipe/common/hooks';
import { UseIngredientListReturnType, useIngredientList } from '@recipe/features/recipeIngredient';

import { useAsIngredient } from './useAsIngredient';
import { ImageUploadProps } from '../components/ImageUpload';
import { UseAsIngredientReturnType } from './useAsIngredient';
import { EditableNotesProps } from '../components/EditableNotes';
import { EditableSourceProps } from '../components/EditableSource';

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
