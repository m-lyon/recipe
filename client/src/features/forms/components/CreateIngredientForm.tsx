import { Reference, useMutation } from '@apollo/client';

import { useErrorToast } from '@recipe/common/hooks';
import { CreateIngredientMutation } from '@recipe/graphql/generated';
import { CREATE_INGREDIENT } from '@recipe/graphql/mutations/ingredient';
import { INGREDIENT_FIELDS_FULL } from '@recipe/graphql/queries/ingredient';

import { BaseIngredientForm } from './BaseIngredientForm';
import { formatIngredientError } from './BaseIngredientForm';
import { BaseIngredientFormProps } from './BaseIngredientForm';

interface Props extends Omit<BaseIngredientFormProps, 'submitForm'> {
    handleComplete: (data: CreateIngredientMutation) => void;
}

export function CreateIngredientForm(props: Props) {
    const { handleComplete, ...rest } = props;
    const toast = useErrorToast();

    const [createIngredient] = useMutation(CREATE_INGREDIENT, {
        onCompleted: handleComplete,
        onError: (error) => {
            toast({
                title: 'Error creating ingredient',
                description: formatIngredientError(error),
                position: 'top',
            });
        },
        update: (cache, { data }) => {
            if (data?.ingredientCreateOne?.record) {
                cache.modify({
                    fields: {
                        ingredientMany(existingRefs = [], { readField }) {
                            const record = data.ingredientCreateOne!.record!;
                            const newRef = cache.writeFragment({
                                data: record,
                                fragment: INGREDIENT_FIELDS_FULL,
                                fragmentName: 'IngredientFieldsFull',
                            });
                            if (
                                existingRefs.some(
                                    (ref: Reference) => readField('_id', ref) === record._id
                                )
                            ) {
                                return existingRefs;
                            }
                            return [...existingRefs, newRef];
                        },
                    },
                });
            }
        },
    });

    const handleSubmit = (formData: ModifyableIngredient) => {
        createIngredient({ variables: { record: formData } });
    };

    return <BaseIngredientForm {...rest} submitForm={handleSubmit} />;
}
