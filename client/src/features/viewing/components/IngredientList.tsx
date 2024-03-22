import { ListItem, UnorderedList } from '@chakra-ui/react';
import { RecipeIngredient } from '../../../__generated__/graphql';
import { LikeFinishedRecipeIngredient } from '../../editing/hooks/useIngredientList';
import { getFinishedRecipeIngredientStr } from '../../editing/hooks/useIngredientList';

export interface IngredientListProps {
    ingredients: RecipeIngredient[];
}
export function IngredientList(props: IngredientListProps) {
    const { ingredients } = props;
    const finishedIngredients = ingredients.map((item) => {
        const ingredientStr = getFinishedRecipeIngredientStr(item as LikeFinishedRecipeIngredient);
        return <ListItem key={ingredientStr}>{ingredientStr}</ListItem>;
    });

    return <UnorderedList>{finishedIngredients}</UnorderedList>;
}
