import { TbLock, TbLockOpen2 } from 'react-icons/tb';
import { BoxProps, Tooltip, UnorderedList, VStack } from '@chakra-ui/react';
import { Box, Flex, IconButton, ListItem, Spacer, Text } from '@chakra-ui/react';

import { useWakeLock } from '@recipe/common/hooks';
import { changeQuantity } from '@recipe/utils/quantity';
import { useUnitConversion } from '@recipe/features/servings';
import { getFinishedRecipeIngredientStr } from '@recipe/utils/formatting';

import { RecipeIngredient } from './RecipeIngredient';

export interface IngredientListProps extends BoxProps {
    subsections: IngredientSubsectionView[];
    currentServings: number;
    origServings: number;
    showWakeLockBtn?: boolean;
}
export function IngredientList(props: IngredientListProps) {
    const { subsections, currentServings, origServings, showWakeLockBtn, ...rest } = props;
    const { apply } = useUnitConversion();
    const { isAwake, toggleWakeLock } = useWakeLock();

    const modifiedSubsections = subsections.map((collection) => {
        const modifiedCollection = collection.ingredients.map((ingredient) => {
            return changeQuantity(ingredient, currentServings, origServings, apply);
        });
        return { ...collection, ingredients: modifiedCollection };
    });

    const subsectionsList = modifiedSubsections.map((collection, index) => {
        const finishedIngredients = collection.ingredients.map((item, i) => {
            if (item.ingredient.__typename === 'Ingredient') {
                return (
                    <ListItem
                        key={item._id}
                        aria-label={`Ingredient #${i + 1} in subsection ${index + 1}`}
                    >
                        {getFinishedRecipeIngredientStr(item)}
                    </ListItem>
                );
            }
            return (
                <RecipeIngredient
                    key={item._id}
                    // ingredient is guaranteed to be a recipe because of the typename check
                    ingredient={item as RecipeIngredientAsRecipeView}
                />
            );
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
        <Box mb='2em' {...rest}>
            <Flex pb='10px'>
                <Text fontSize='2xl'>{modifiedSubsections[0].name ?? 'Ingredients'}</Text>
                <Spacer />
                {showWakeLockBtn ? (
                    <Tooltip
                        label={isAwake ? 'Allow screen to sleep' : 'Keep screen awake'}
                        openDelay={500}
                    >
                        <IconButton
                            aria-label={isAwake ? 'Allow screen to sleep' : 'Keep screen awake'}
                            icon={isAwake ? <TbLockOpen2 /> : <TbLock />}
                            onClick={toggleWakeLock}
                        />
                    </Tooltip>
                ) : undefined}
            </Flex>
            <VStack spacing='24px' align='left'>
                {subsectionsList}
            </VStack>
        </Box>
    );
}
