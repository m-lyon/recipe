import { Box, VStack } from '@chakra-ui/react';
import { Tag, TagLabel } from '@chakra-ui/react';
import { RecipeIngredient } from '../../../__generated__/graphql';

interface Props {
    ingredients: (RecipeIngredient | null)[];
}
export function IngredientList(props: Props) {
    const { ingredients } = props;

    const getIngredientStr = (ingr: RecipeIngredient) => {
        const { quantity, unit, ingredient, prepMethod } = ingr;
        const quantityStr = quantity !== null ? `${quantity} ` : '';
        const unitStr = unit != null ? `${unit.shortSingular} ` : '';
        const prepMethodStr = prepMethod != null ? `${prepMethod.value} ` : '';
        const ingredientStr = ingredient != null ? `${ingredient.name}` : '';
        return `${quantityStr}${unitStr}${prepMethodStr}${ingredientStr}`;
    };

    const finishedIngredients = ingredients.map((item: RecipeIngredient | null) => {
        if (item === null) {
            return null;
        }
        const ingredientStr = getIngredientStr(item);
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
