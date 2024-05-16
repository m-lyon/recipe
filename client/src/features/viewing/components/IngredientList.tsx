import { ListItem, UnorderedList } from '@chakra-ui/react';

import { RecipeIngredient } from '@recipe/graphql/generated';
import { LikeFinishedRecipeIngredient } from '@recipe/types';
import { getFinishedRecipeIngredientStr } from '@recipe/utils/formatting';

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
