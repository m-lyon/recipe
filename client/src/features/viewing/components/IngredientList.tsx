import { LuAsterisk } from 'react-icons/lu';
import { TbLock, TbLockOpen2 } from 'react-icons/tb';
import { BoxProps, Tooltip, UnorderedList, VStack } from '@chakra-ui/react';
import { Box, Flex, IconButton, ListItem, Spacer, Text } from '@chakra-ui/react';

import { useWakeLock } from '@recipe/common/hooks';
import { usePreferencesStore } from '@recipe/stores';
import { changeQuantity } from '@recipe/utils/quantity';
import { useUnitConversion } from '@recipe/features/servings';
import { getFinishedRecipeIngredientStr } from '@recipe/utils/formatting';

import { RecipeIngredient } from './RecipeIngredient';

/** A quantity shown in the reader's system: rounded, with the authored line on hover. */
function ApproximateIngredient(props: { item: RecipeIngredientView; authored: string }) {
    const { item, authored } = props;
    return (
        <Tooltip label={`As written: ${authored}`} hasArrow openDelay={300}>
            <Box as='span' tabIndex={0} aria-label={`Approximately, as written ${authored}`}>
                ≈ {getFinishedRecipeIngredientStr(item)}
            </Box>
        </Tooltip>
    );
}

function UncountedIngredientHint() {
    return (
        <Tooltip
            label='Not included in nutritional calculation'
            hasArrow
            closeOnClick={false}
            closeOnPointerDown={false}
        >
            <Box
                as='span'
                tabIndex={0}
                display='inline-flex'
                verticalAlign='middle'
                position='relative'
                top='-0.35em'
                ml={1}
                color='teal'
                cursor='pointer'
                aria-label='Not counted in nutrition'
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
    const { apply, convert } = useUnitConversion();
    const unitSystem = usePreferencesStore((state) => state.unitSystem);
    const { isAwake, toggleWakeLock } = useWakeLock();

    const modifiedSubsections = subsections.map((collection) => {
        const modifiedCollection = collection.ingredients.map((ingredient) => {
            const scaled = changeQuantity(ingredient, currentServings, origServings, apply);
            const converted = convert(scaled, unitSystem);
            const authored = converted.approximate ? getFinishedRecipeIngredientStr(scaled) : null;
            return {
                ...scaled,
                quantity: converted.quantity,
                unit: converted.unit,
                authored,
            };
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
                        {item.authored ? (
                            <ApproximateIngredient item={item} authored={item.authored} />
                        ) : (
                            getFinishedRecipeIngredientStr(item)
                        )}
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
