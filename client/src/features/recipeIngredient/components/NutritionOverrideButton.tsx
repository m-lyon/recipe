import { TbScale } from 'react-icons/tb';
import { useQuery } from '@apollo/client';
import { PopoverTrigger } from '@chakra-ui/react';
import { Text, Tooltip, useDisclosure } from '@chakra-ui/react';
import { PopoverCloseButton, PopoverContent, PopoverHeader } from '@chakra-ui/react';
import { IconButton, Popover, PopoverArrow, PopoverBody, Portal } from '@chakra-ui/react';

import { GET_INGREDIENT_COMPONENTS } from '@recipe/graphql/queries/recipe';
import { describeNutritionOverride } from '@recipe/utils/nutritionOverride';

import { NutritionOverrideForm } from './NutritionOverrideForm';

interface Props {
    item: FinishedRecipeIngredient;
    /** The line as it reads, such as "1 cup oil". */
    line: string;
    setNutritionOverride: (override: NutritionOverride | null) => void;
}
export function NutritionOverrideButton(props: Props) {
    const { item, line, setNutritionOverride } = props;
    const { isOpen, onOpen, onClose } = useDisclosure();
    const { data } = useQuery(GET_INGREDIENT_COMPONENTS);
    const units = (data?.units ?? []).filter((unit) => unit.unique);
    const defaultUnit =
        item.unit ?? units.find((unit) => unit.standard === 'teaspoon') ?? units[0] ?? null;
    const override = item.nutritionOverride;
    const counts = override ? `Nutrition counts ${describeNutritionOverride(override)}` : null;

    return (
        <Popover isOpen={isOpen} onOpen={onOpen} onClose={onClose} placement='bottom' isLazy>
            <Tooltip label={counts} isDisabled={!counts || isOpen} hasArrow openDelay={300}>
                <span>
                    <PopoverTrigger>
                        <IconButton
                            icon={<TbScale />}
                            size='xs'
                            variant='ghost'
                            colorScheme={override ? 'teal' : 'gray'}
                            color={override ? undefined : 'gray.400'}
                            ml={1}
                            aria-label={
                                counts ? `${counts}. Change for ${line}` : `Nutrition for ${line}`
                            }
                        />
                    </PopoverTrigger>
                </span>
            </Tooltip>
            <Portal>
                {/* Stops a drag of the tag behind it from starting in the form. */}
                <PopoverContent onPointerDown={(e) => e.stopPropagation()}>
                    <PopoverArrow />
                    <PopoverCloseButton aria-label='Close nutrition form' />
                    <PopoverHeader border='hidden' fontWeight={600}>
                        Nutrition
                    </PopoverHeader>
                    <PopoverBody pt={0}>
                        <Text fontSize='sm' color='gray.500' mb={3}>
                            How much of {line} the nutrition counts. The recipe still shows the line
                            as written.
                        </Text>
                        <NutritionOverrideForm
                            override={override}
                            hasQuantity={!!item.quantity}
                            defaultUnit={defaultUnit}
                            units={units}
                            onApply={(next) => {
                                setNutritionOverride(next);
                                onClose();
                            }}
                        />
                    </PopoverBody>
                </PopoverContent>
            </Portal>
        </Popover>
    );
}
