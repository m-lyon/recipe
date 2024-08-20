import { ListItem, UnorderedList } from '@chakra-ui/react';

import { RecipeIngredient as RecipeIngredientType } from '@recipe/graphql/generated';
import { LikeFinishedRecipeIngredient } from '@recipe/types';
import { getFinishedRecipeIngredientStr } from '@recipe/utils/formatting';

import { RecipeIngredient } from './RecipeIngredient';

export interface IngredientListProps {
    ingredients: RecipeIngredientType[];
}
export function IngredientList(props: IngredientListProps) {
    const { ingredients } = props;
    const finishedIngredients = ingredients.map((item) => {
        if (item.type === 'ingredient') {
            return (
                <ListItem key={item._id}>
                    {getFinishedRecipeIngredientStr(item as LikeFinishedRecipeIngredient)}
                </ListItem>
            );
        }
        return <RecipeIngredient key={item._id} ingredient={item} />;
    });

    return <UnorderedList>{finishedIngredients}</UnorderedList>;
}
