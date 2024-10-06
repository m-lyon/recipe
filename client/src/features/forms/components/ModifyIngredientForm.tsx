import { useMutation } from '@apollo/client';

import { useErrorToast } from '@recipe/common/hooks';
import { ModifyIngredientMutation } from '@recipe/graphql/generated';
import { DELETE_INGREDIENT } from '@recipe/graphql/mutations/ingredient';
import { MODIFY_INGREDIENT } from '@recipe/graphql/mutations/ingredient';
import { INGREDIENT_FIELDS_FULL } from '@recipe/graphql/queries/ingredient';

import { IngredientFormData } from './BaseIngredientForm';
import { BaseIngredientForm } from './BaseIngredientForm';
import { formatIngredientError } from './BaseIngredientForm';
import { BaseIngredientFormProps } from './BaseIngredientForm';

interface Props extends Omit<BaseIngredientFormProps, 'handleSubmit'> {
    handleComplete: (data: ModifyIngredientMutation) => void;
    handleDelete: () => void;
    ingredientId?: string;
}

export function ModifyIngredientForm(props: Props) {
    const { handleComplete, handleDelete, ingredientId, ...rest } = props;
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
        onCompleted: handleDelete,
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

    const handleSubmit = (formData: IngredientFormData) => {
        if (ingredientId) {
            modifyIngredient({ variables: { record: formData, id: ingredientId } });
        }
    };

    const onDelete = () => {
        if (ingredientId) {
            deleteIngredient({ variables: { id: ingredientId } });
        }
    };

    return <BaseIngredientForm {...rest} handleSubmit={handleSubmit} handleDelete={onDelete} />;
}
