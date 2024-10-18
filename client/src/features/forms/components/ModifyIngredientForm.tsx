import { useMutation } from '@apollo/client';

import { useErrorToast } from '@recipe/common/hooks';
import { ModifyIngredientMutation } from '@recipe/graphql/generated';
import { DELETE_INGREDIENT } from '@recipe/graphql/mutations/ingredient';
import { MODIFY_INGREDIENT } from '@recipe/graphql/mutations/ingredient';
import { INGREDIENT_FIELDS_FULL } from '@recipe/graphql/queries/ingredient';

import { BaseIngredientForm } from './BaseIngredientForm';
import { formatIngredientError } from './BaseIngredientForm';
import { BaseIngredientFormProps } from './BaseIngredientForm';

interface Props extends Omit<BaseIngredientFormProps, 'submitForm'> {
    handleComplete: (data: ModifyIngredientMutation) => void;
    onDelete: () => void;
    ingredientId?: string;
}

export function ModifyIngredientForm(props: Props) {
    const { handleComplete, onDelete, ingredientId, ...rest } = props;
    const toast = useErrorToast();

    const [modifyIngredient] = useMutation(MODIFY_INGREDIENT, {
        onCompleted: handleComplete,
        onError: (error) => {
            toast({
                title: 'Error modifying ingredient',
                description: formatIngredientError(error),
                position: 'top',
            });
        },
        update: (cache, { data }) => {
            if (data?.ingredientUpdateById?.record) {
                cache.writeFragment({
                    id: `Ingredient:${data.ingredientUpdateById.record._id}`,
                    fragment: INGREDIENT_FIELDS_FULL,
                    fragmentName: 'IngredientFieldsFull',
                    data: data.ingredientUpdateById.record,
                });
            }
        },
    });

    const [deleteIngredient] = useMutation(DELETE_INGREDIENT, {
        onCompleted: onDelete,
        onError: (error) => {
            toast({
                title: 'Error deleting ingredient',
                description: formatIngredientError(error),
                position: 'top',
            });
        },
        update: (cache, { data }) => {
            cache.evict({ id: `Ingredient:${data?.ingredientRemoveById?.recordId}` });
        },
    });

    const handleSubmit = (formData: ModifyableIngredient) => {
        if (ingredientId) {
            modifyIngredient({ variables: { record: formData, id: ingredientId } });
        }
    };

    const handleDelete = () => {
        if (ingredientId) {
            deleteIngredient({ variables: { id: ingredientId } });
        }
    };

    return <BaseIngredientForm {...rest} submitForm={handleSubmit} onDelete={handleDelete} />;
}
