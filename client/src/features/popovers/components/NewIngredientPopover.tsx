import { MutableRefObject } from 'react';

import { CreateIngredientForm } from '@recipe/features/forms';
import { CreateIngredientMutation } from '@recipe/graphql/generated';

import { BasePopover } from './BasePopover';

interface Props {
    fieldRef: MutableRefObject<HTMLInputElement | null>;
    onClose: () => void;
    setItem: (item: IngredientChoice) => void;
}
export function NewIngredientPopover(props: Props) {
    return (
        <BasePopover
            {...props}
            title='Ingredient'
            FormComponent={CreateIngredientForm}
            extractRecord={(data: CreateIngredientMutation) => data.ingredientCreateOne!.record!}
            extractDescription={(record: IngredientChoice) => record.name}
        />
    );
}
