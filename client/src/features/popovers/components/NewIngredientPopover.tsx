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
    const title = 'Ingredient';
    const extractRecord = (data: CreateIngredientMutation) => data.ingredientCreateOne!.record!;
    const extractDescription = (record: IngredientChoice) => record.name;

    return (
        <BasePopover
            {...props}
            title={title}
            FormComponent={CreateIngredientForm}
            extractRecord={extractRecord}
            extractDescription={extractDescription}
        />
    );
}
