import { CgBowl } from 'react-icons/cg';
import { TbWeight } from 'react-icons/tb';
import { UnorderedList, VStack, useToast } from '@chakra-ui/react';
import { Box, Flex, HStack, IconButton, ListItem, Spacer, Text } from '@chakra-ui/react';

import { DELAY_SHORT } from '@recipe/constants';
import { changeQuantity } from '@recipe/utils/quantity';
import { useUnitConversion } from '@recipe/features/servings';
import { getFinishedRecipeIngredientStr } from '@recipe/utils/formatting';
import { IngredientSubsection, LikeFinishedRecipeIngredient } from '@recipe/types';
import { RecipeAsIngredient } from '@recipe/types';

import { RecipeIngredient } from './RecipeIngredient';

export interface IngredientListProps {
    subsections: IngredientSubsection[];
    currentServings: number;
    origServings: number;
    weightAndVolumeBtns?: boolean;
}
export function IngredientList(props: IngredientListProps) {
    const { subsections, currentServings, origServings, weightAndVolumeBtns } = props;
    const { apply } = useUnitConversion();
    const toast = useToast();

    const modifiedSubsections = subsections.map((collection) => {
        const modifiedCollection = collection.ingredients.map((ingredient) => {
            return changeQuantity(ingredient, currentServings, origServings, apply);
        });
        return { ...collection, ingredients: modifiedCollection };
    });

    const subsectionsList = modifiedSubsections.map((collection, index) => {
        const finishedIngredients = collection.ingredients.map((item, i) => {
            if (item.type === 'ingredient') {
                return (
                    <ListItem
                        key={item._id}
                        aria-label={`Ingredient #${i + 1} in subsection ${index + 1}`}
                    >
                        {getFinishedRecipeIngredientStr(item as LikeFinishedRecipeIngredient)}
                    </ListItem>
                );
            }
            return <RecipeIngredient key={item._id} ingredient={item as RecipeAsIngredient} />;
        });
        if (index === 0) {
            return (
                <Box key={collection.name ?? 'main-ingredients'}>
                    <UnorderedList>{finishedIngredients}</UnorderedList>
                </Box>
            );
        } else {
            return (
                <Box key={collection.name}>
                    <Text fontSize='2xl' pb='10px'>
                        {collection.name}
                    </Text>
                    <UnorderedList>{finishedIngredients}</UnorderedList>
                </Box>
            );
        }
    });

    return (
        <Box>
            <Flex pb='10px'>
                <Text fontSize='2xl'>{modifiedSubsections[0].name ?? 'Ingredients'}</Text>
                <Spacer />
                {weightAndVolumeBtns ? (
                    <HStack spacing={2}>
                        <IconButton
                            aria-label='weight'
                            icon={<TbWeight />}
                            onClick={() =>
                                toast({
                                    title: 'Weight',
                                    description: 'Weight conversion is not supported yet',
                                    status: 'info',
                                    duration: DELAY_SHORT,
                                    isClosable: true,
                                })
                            }
                        />
                        <IconButton
                            aria-label='volume'
                            icon={<CgBowl />}
                            onClick={() =>
                                toast({
                                    title: 'Volume',
                                    description: 'Volume conversion is not supported yet',
                                    status: 'info',
                                    duration: DELAY_SHORT,
                                    isClosable: true,
                                })
                            }
                        />
                    </HStack>
                ) : undefined}
            </Flex>
            <VStack spacing='24px' align='left'>
                {subsectionsList}
            </VStack>
        </Box>
    );
}
