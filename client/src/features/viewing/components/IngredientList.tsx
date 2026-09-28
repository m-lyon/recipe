import { LuAsterisk } from 'react-icons/lu';
import { TbLock, TbLockOpen2 } from 'react-icons/tb';
import { PointerEvent, useRef, useState } from 'react';
import { Box, Flex, IconButton, ListItem, Spacer, Text } from '@chakra-ui/react';
import { BoxProps, Tooltip, UnorderedList, VStack, useOutsideClick } from '@chakra-ui/react';

import { useWakeLock } from '@recipe/common/hooks';
import { changeQuantity } from '@recipe/utils/quantity';
import { useUnitConversion } from '@recipe/features/servings';
import { getFinishedRecipeIngredientStr } from '@recipe/utils/formatting';

import { RecipeIngredient } from './RecipeIngredient';

/** Hover does not exist on touch screens, so the tooltip is controlled: a mouse
 *  opens it on hover, a tap toggles it, and a tap elsewhere closes it. */
function UncountedIngredientHint() {
    const [isOpen, setIsOpen] = useState(false);
    const ref = useRef<HTMLSpanElement>(null);
    useOutsideClick({ ref, handler: () => setIsOpen(false) });

    return (
        <Tooltip label='Not included in nutritional calculation' hasArrow isOpen={isOpen}>
            <Box
                as='span'
                ref={ref}
                display='inline-flex'
                verticalAlign='middle'
                position='relative'
                top='-0.35em'
                ml={1}
                color='teal'
                cursor='pointer'
                aria-label='Not counted in nutrition'
                aria-expanded={isOpen}
                onPointerEnter={(e: PointerEvent<HTMLSpanElement>) =>
                    e.pointerType === 'mouse' && setIsOpen(true)
                }
                onPointerLeave={(e: PointerEvent<HTMLSpanElement>) =>
                    e.pointerType === 'mouse' && setIsOpen(false)
                }
                onPointerDown={(e: PointerEvent<HTMLSpanElement>) =>
                    e.pointerType !== 'mouse' && setIsOpen((o) => !o)
                }
            >
                <LuAsterisk />
            </Box>
        </Tooltip>
    );
}

export interface IngredientListProps extends BoxProps {
    subsections: IngredientSubsectionView[];
    currentServings: number;
    origServings: number;
    showWakeLockBtn?: boolean;
    uncountedIngredientIds?: Set<string>;
    dietToggle?: React.ReactNode;
}
export function IngredientList(props: IngredientListProps) {
    const {
        subsections,
        currentServings,
        origServings,
        showWakeLockBtn,
        uncountedIngredientIds,
        dietToggle,
        ...rest
    } = props;
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
                        {uncountedIngredientIds?.has(item._id) && <UncountedIngredientHint />}
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
                {dietToggle}
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
