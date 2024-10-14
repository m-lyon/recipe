import { useState } from 'react';

import { ServingsProps } from '@recipe/features/servings';
import { ImageUploadProps } from '@recipe/features/images';
import { UseTagListReturnType, useTagList } from '@recipe/features/tags';
import { UseIngredientListReturnType, useIngredientList } from '@recipe/features/recipeIngredient';

import { useAsIngredient } from './useAsIngredient';
import { UseAsIngredientReturnType } from './useAsIngredient';
import { EditableNotesProps } from '../components/EditableNotes';
import { EditableTitleProps } from '../components/EditableTitle';
import { EditableSourceProps } from '../components/EditableSource';
import { UseInstructionListReturnType, useInstructionList } from './useInstructionsList';

export interface RecipeState {
    numServings: ServingsProps;
    ingredient: UseIngredientListReturnType;
    notes: EditableNotesProps;
    instructions: UseInstructionListReturnType;
    tags: UseTagListReturnType;
    title: EditableTitleProps;
    source: EditableSourceProps;
    asIngredient: UseAsIngredientReturnType;
    images: ImageUploadProps;
}
export function useRecipeState(): RecipeState {
    const [numServings, setNumServings] = useState<number>(1);
    const ingredient = useIngredientList();
    const instructions = useInstructionList();
    const tags = useTagList();
    const [title, setTitle] = useState<string>('');
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
        title: { value: title, setTitle },
        source: { source, setSource },
        asIngredient,
        images: { images, setImages },
    };
}
