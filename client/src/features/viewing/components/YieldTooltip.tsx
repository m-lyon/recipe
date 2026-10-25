import { InfoOutlineIcon } from '@chakra-ui/icons';
import { Box, ListItem, Text, Tooltip, UnorderedList } from '@chakra-ui/react';

import { scaleQuantity } from '@recipe/utils/quantity';
import { getYieldRowStr } from '@recipe/utils/formatting';

interface Props {
    rows: CompletedRecipeView['yield'];
    title: string;
    pluralTitle?: string | null;
    currentServings: number;
    origServings: number;
}

export function YieldTooltip(props: Props) {
    const { rows, title, pluralTitle, currentServings, origServings } = props;
    const lines = (rows ?? []).map((row) => {
        const quantity = scaleQuantity(row.quantity, currentServings, origServings, row.unit);
        return getYieldRowStr(quantity, row.unit, title, pluralTitle);
    });
    if (lines.length === 0) return null;
    const label = (
        <Box aria-label='Recipe yield'>
            <Text fontWeight={600} align={'left'}>
                Makes
            </Text>
            <UnorderedList>
                {lines.map((line) => (
                    <ListItem key={line}>{line}</ListItem>
                ))}
            </UnorderedList>
        </Box>
    );
    return (
        <Tooltip label={label} placement='bottom' openDelay={300} hasArrow>
            <Box
                as='span'
                display='inline-flex'
                ml={1.5}
                tabIndex={0}
                pointerEvents='auto'
                cursor='pointer'
                aria-label='Show recipe yield'
            >
                <InfoOutlineIcon />
            </Box>
        </Tooltip>
    );
}
