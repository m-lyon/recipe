import { Box, VStack } from '@chakra-ui/react';
import { Tag, TagLabel } from '@chakra-ui/react';
import { RecipeIngredient } from '../../../__generated__/graphql';
import { getIngredientStr } from '../../CreateRecipe/hooks/useIngredientList';
import { isPlural } from '../../../utils/plural';

interface Props {
    ingredients: (RecipeIngredient | null)[];
}
export function IngredientList(props: Props) {
    const { ingredients } = props;

    const finishedIngredients = ingredients.map((item: RecipeIngredient | null) => {
        if (item === null) {
            return null;
        }
        const ingredientStr = getIngredientStr(
            item.quantity,
            isPlural(item.quantity) ? item.unit?.longPlural! : item.unit?.longSingular!,
            item.ingredient?.name!,
            item.prepMethod?.value!
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
