import { ListItem, UnorderedList } from '@chakra-ui/react';
import { FinishedRecipeIngredient } from '../../editing/hooks/useIngredientList';
import { getFinishedRecipeIngredientStr } from '../../editing/hooks/useIngredientList';

export interface IngredientListProps {
    ingredients: FinishedRecipeIngredient[];
}
export function IngredientList(props: IngredientListProps) {
    const { ingredients } = props;
    const finishedIngredients = ingredients.map((item) => {
        const ingredientStr = getFinishedRecipeIngredientStr(item);
        return <ListItem key={ingredientStr}>{ingredientStr}</ListItem>;
    });

    return <UnorderedList>{finishedIngredients}</UnorderedList>;
}
