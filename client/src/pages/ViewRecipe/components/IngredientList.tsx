import { Box, VStack } from '@chakra-ui/react';
import { Tag, TagLabel } from '@chakra-ui/react';
import { GetRecipeQuery } from '../../../__generated__/graphql';
import { getIngredientStr } from '../../CreateRecipe/hooks/useIngredientList';
import { isPlural } from '../../../utils/plural';
import { isPluralIngredient } from '../../CreateRecipe/components/EditableIngredientList/components/IngredientNameDropdownList';
import { getUnitDisplayValue } from '../../CreateRecipe/components/EditableIngredientList/components/UnitDropdownList';

interface Props {
    ingredients: NonNullable<GetRecipeQuery['recipeById']>['ingredients'];
}
export function IngredientList(props: Props) {
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
        return (
            <Tag size='lg' marginBottom='5px' key={ingredientStr}>
                <TagLabel>{ingredientStr}</TagLabel>
            </Tag>
        );
    });

    return (
        <VStack spacing='24px' align='left'>
            <Box fontSize='2xl'>Ingredients</Box>
            <VStack spacing='10px' align='left'>
                {finishedIngredients}
            </VStack>
        </VStack>
    );
}
