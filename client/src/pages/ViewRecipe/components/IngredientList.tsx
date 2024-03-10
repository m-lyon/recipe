import { ListItem, UnorderedList } from '@chakra-ui/react';

import { isPlural } from '../../../utils/plural';
import { RecipeIngredient } from '../../../__generated__/graphql';
import { getIngredientStr } from '../../CreateRecipe/hooks/useIngredientList';
import { isPluralIngredient } from '../../CreateRecipe/components/EditableIngredientList/components/IngredientDropdownList';
import { getUnitDisplayValue } from '../../CreateRecipe/components/EditableIngredientList/components/UnitDropdownList';

function getIngredientNameStr(plural: boolean, ingredient: RecipeIngredient['ingredient']): string {
    if (ingredient == null) {
        throw new Error('Ingredient cannot be null or undefined');
    }
    if (ingredient.__typename === 'Recipe') {
        return plural ? ingredient.pluralTitle?.toLowerCase()! : ingredient.title.toLowerCase()!;
    } else if (ingredient.__typename === 'Ingredient') {
        return plural ? ingredient.pluralName! : ingredient.name!;
    }
    throw new Error(`Invalid ingredient type: ${ingredient.__typename}`);
}

function isCountable(ingredient: RecipeIngredient['ingredient']): boolean {
    if (ingredient == null) {
        throw new Error('Ingredient cannot be null or undefined');
    }
    if (ingredient.__typename === 'Recipe') {
        return false;
    } else if (ingredient.__typename === 'Ingredient') {
        return ingredient.isCountable;
    }
    throw new Error(`Invalid ingredient type: ${ingredient.__typename}`);
}

export interface IngredientListProps {
    ingredients: RecipeIngredient[];
}
export function IngredientList(props: IngredientListProps) {
    const { ingredients } = props;
    const finishedIngredients = ingredients.map((item) => {
        if (item === null) {
            return null;
        }
        const { quantity, unit, ingredient, prepMethod } = item;
        const plural = isPlural(quantity);
        const pluralIngr = isPluralIngredient(plural, unit !== null, isCountable(ingredient));
        const ingredientStr = getIngredientStr(
            quantity,
            unit != null ? getUnitDisplayValue(unit, plural, true) : null,
            getIngredientNameStr(pluralIngr, ingredient),
            prepMethod ? prepMethod.value : null
        );
        return <ListItem key={ingredientStr}>{ingredientStr}</ListItem>;
    });

    return <UnorderedList>{finishedIngredients}</UnorderedList>;
}
