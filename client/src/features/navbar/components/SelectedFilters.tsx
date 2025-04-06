import { HStack, Tag, TagCloseButton, TagLabel } from '@chakra-ui/react';

import { useSelectedFilters } from '@recipe/features/search';

import { FlexNav } from './FlexNav';
import { NAV_HEIGHT } from '../constants';

interface Props {
    removeFilter: (item: FilterChoice) => void;
}
export function SelectedFilters(props: Props) {
    const { removeFilter } = props;
    const { showSearch, selectedFilters } = useSelectedFilters();

    return (
        <FlexNav
            mt={showSearch ? `${NAV_HEIGHT}px` : '0px'}
            transition='margin-top 0.3s'
            zIndex={11}
            justifyContent='center'
            minH='32px'
            maxH='32px'
            borderBottom={0}
            pb={0}
        >
            <HStack spacing={4}>
                {selectedFilters.map((item) => (
                    <Tag key={item.value}>
                        <TagLabel>{item.value}</TagLabel>
                        <TagCloseButton
                            onClick={() => removeFilter(item)}
                            aria-label={`Remove ${item.value} filter`}
                        />
                    </Tag>
                ))}
            </HStack>
        </FlexNav>
    );
}
