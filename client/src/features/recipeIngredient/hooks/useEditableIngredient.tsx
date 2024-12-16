import { useQuery } from '@apollo/client';

import { useRecipeStore } from '@recipe/stores';
import { useErrorToast } from '@recipe/common/hooks';
import { useUnitConversion } from '@recipe/features/servings';
import { GET_INGREDIENT_COMPONENTS } from '@recipe/graphql/queries/recipe';

export function useEditableIngredient(section: number) {
    const toast = useErrorToast();
    const { data } = useQuery(GET_INGREDIENT_COMPONENTS);
    const { apply } = useUnitConversion();
    const setAttribute = useRecipeStore((state) => state.setEditableIngredientAttribute);
    const handleChange = useRecipeStore((state) => state.handleIngredientChange);

    const setIngredientAttribute = (attr: SetAttr) => {
        try {
            setAttribute(section, attr, data, apply);
        } catch (e: unknown) {
            if (e instanceof Error) {
                toast({ title: 'Invalid input', description: e.message });
            }
        }
    };
    const handleIngredientChange = (value: string) => {
        try {
            handleChange(section, value, data, apply);
        } catch (e: unknown) {
            if (e instanceof Error) {
                toast({ title: 'Invalid input', description: e.message });
            }
        }
    };

    return { data, setIngredientAttribute, handleIngredientChange };
}
