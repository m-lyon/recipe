import { useRef } from 'react';
import { Modifier } from '@apollo/client/cache';
import { Reference, useMutation } from '@apollo/client';

import { useErrorToast } from '@recipe/common/hooks';
import { CreateIngredientMutation } from '@recipe/graphql/generated';
import { CREATE_INGREDIENT } from '@recipe/graphql/mutations/ingredient';
import { INGREDIENT_FIELDS_FULL } from '@recipe/graphql/queries/ingredient';

import { BaseIngredientForm } from './BaseIngredientForm';
import { UsdaLinkSectionHandle } from './UsdaLinkSection';
import { formatIngredientError } from './BaseIngredientForm';
import { BaseIngredientFormProps } from './BaseIngredientForm';

interface Props extends Omit<BaseIngredientFormProps, 'submitForm'> {
    handleComplete: (data: CreateIngredientMutation) => void;
}

export function CreateIngredientForm(props: Props) {
    const { handleComplete, ...rest } = props;
    const toast = useErrorToast();
    const usdaLinkRef = useRef<UsdaLinkSectionHandle>(null);

    const [createIngredient] = useMutation(CREATE_INGREDIENT, {
        onCompleted: (data) => {
            const newIngredientId = data.ingredientCreateOne?.record?._id;
            if (newIngredientId) {
                usdaLinkRef.current?.commitChanges(newIngredientId).catch((err) => {
                    toast({
                        title: 'Ingredient saved, but nutritional data link failed',
                        description: err instanceof Error ? err.message : String(err),
                        position: 'top',
                    });
                });
            }
            handleComplete(data);
        },
        onError: (error) => {
            toast({
                title: 'Error creating ingredient',
                description: formatIngredientError(error),
                position: 'top',
            });
        },
        update: (cache, { data }) => {
            if (data?.ingredientCreateOne?.record) {
                const addRecord: Modifier<readonly Reference[]> = (
                    existingRefs = [],
                    { readField }
                ) => {
                    const record = data.ingredientCreateOne!.record!;
                    const newRef = cache.writeFragment({
                        data: record,
                        fragment: INGREDIENT_FIELDS_FULL,
                        fragmentName: 'IngredientFieldsFull',
                    });
                    if (
                        existingRefs.some((ref: Reference) => readField('_id', ref) === record._id)
                    ) {
                        return existingRefs;
                    }
                    return [...existingRefs, newRef];
                };
                // The creator owns the new ingredient, so it also belongs in the editable list.
                cache.modify<Record<'ingredientMany' | 'ingredientManyEditable', Reference[]>>({
                    fields: { ingredientMany: addRecord, ingredientManyEditable: addRecord },
                });
            }
        },
    });

    const handleSubmit = (formData: ModifyableIngredient) => {
        createIngredient({ variables: { record: formData } });
    };

    return <BaseIngredientForm {...rest} ref={usdaLinkRef} submitForm={handleSubmit} />;
}
