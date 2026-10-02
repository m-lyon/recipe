import { Button, Stack, Text } from '@chakra-ui/react';

import { UsdaPortion } from './UsdaPortionPicker';

export interface UsdaDensitySuggestionProps {
    /** The portion the density is derived from. Shown so the reader can judge it. */
    portion: UsdaPortion;
    density: number;
    /** The form's current density, when it differs from the suggestion by more than 10%. */
    currentDensity?: number;
    disabled?: boolean;
    onApply: () => void;
}

function round2(n: number): string {
    return n.toFixed(2).replace(/\.?0+$/, '');
}

/** Reports a density derived from a volume portion. Applying it is always explicit:
 *  density lives on the Ingredient, a document the reader did not set out to edit,
 *  and a qualified modifier such as "cup, chopped" is a packing density, not a real one. */
export function UsdaDensitySuggestion(props: UsdaDensitySuggestionProps) {
    const { portion, density, currentDensity, disabled, onApply } = props;

    return (
        <Stack spacing={1}>
            <Text fontSize='sm'>
                Suggested density: {round2(density)} g/ml (from {portion.description} ={' '}
                {portion.gramWeight} g)
            </Text>
            {portion.ambiguous && (
                <Text fontSize='xs' color='orange.500'>
                    “{portion.description}” carries a qualifier, so this is a packing density rather
                    than a true density. Check it before applying.
                </Text>
            )}
            {currentDensity != null && (
                <Text fontSize='xs' color='gray.500'>
                    Current density: {round2(currentDensity)} g/ml
                </Text>
            )}
            <Button
                size='sm'
                variant='outline'
                alignSelf='flex-start'
                isDisabled={disabled}
                onClick={onApply}
                aria-label='Apply suggested density'
            >
                Apply
            </Button>
        </Stack>
    );
}
