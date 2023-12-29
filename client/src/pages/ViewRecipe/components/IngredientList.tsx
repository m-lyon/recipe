import { ListItem, UnorderedList } from '@chakra-ui/react';
import { RecipeIngredient } from '../../../__generated__/graphql';
import { getIngredientStr } from '../../CreateRecipe/hooks/useIngredientList';
import { isPlural } from '../../../utils/plural';
import { isPluralIngredient } from '../../CreateRecipe/components/EditableIngredientList/components/IngredientNameDropdownList';
import { getUnitDisplayValue } from '../../CreateRecipe/components/EditableIngredientList/components/UnitDropdownList';

export interface IngredientListProps {
    ingredients: RecipeIngredient[];
}
export function IngredientList(props: IngredientListProps) {
    const { ingredients } = props;
    const finishedIngredients = ingredients.map((item) => {
        if (item === null) {
            return null;
        }
        const plural = isPlural(item.quantity);
        const pluralIngr = isPluralIngredient(
            plural,
            item.unit !== null,
            item.ingredient!.isCountable
        );
        const ingredientStr = getIngredientStr(
            item.quantity,
            item.unit != null ? getUnitDisplayValue(item.unit, plural, true) : null,
            pluralIngr ? item.ingredient!.pluralName! : item.ingredient!.name!,
            item.prepMethod ? item.prepMethod.value : null
        );
        return <ListItem key={ingredientStr}>{ingredientStr}</ListItem>;
    });

    return <UnorderedList>{finishedIngredients}</UnorderedList>;
}
