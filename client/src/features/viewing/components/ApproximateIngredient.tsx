import { Box, Tooltip } from '@chakra-ui/react';

import { getFinishedRecipeIngredientStr } from '@recipe/utils/formatting';

/** A quantity shown in the reader's system: rounded, with the authored line on hover. */
export function ApproximateIngredient(props: { item: RecipeIngredientView; authored: string }) {
    const { item, authored } = props;
    return (
        <Tooltip label={`As written: ${authored}`} hasArrow openDelay={300}>
            <Box as='span' tabIndex={0} aria-label={`Approximately, as written ${authored}`}>
                ≈ {getFinishedRecipeIngredientStr(item)}
            </Box>
        </Tooltip>
    );
}
