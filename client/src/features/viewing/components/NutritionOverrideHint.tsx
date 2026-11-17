import { TbScale } from 'react-icons/tb';
import { Box, Tooltip } from '@chakra-ui/react';

import { describeNutritionOverride } from '@recipe/utils/nutritionOverride';

/** Tells a reader that the nutrition counts a different amount from the line. */
export function NutritionOverrideHint(props: { override: NutritionOverride }) {
    const label = `Nutrition counts ${describeNutritionOverride(props.override)}`;
    return (
        <Tooltip label={label} hasArrow closeOnClick={false} closeOnPointerDown={false}>
            <Box
                as='span'
                tabIndex={0}
                display='inline-flex'
                verticalAlign='middle'
                ml={1}
                color='gray.400'
                cursor='pointer'
                aria-label={label}
            >
                <TbScale />
            </Box>
        </Tooltip>
    );
}
