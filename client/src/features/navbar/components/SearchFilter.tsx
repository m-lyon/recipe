import { HStack, VStack, useBreakpointValue } from '@chakra-ui/react';

import { useSelectedFilters } from '@recipe/features/search';
import { ArchivedFilter, IngredientFilter, TagFilter } from '@recipe/features/search';

import { FlexNav } from './FlexNav';
import { NAV_HEIGHT, SEARCH_FILTER_MOBILE_HEIGHT, SELECTED_FILTERS_HEIGHT } from '../constants';

interface Props {
    addFilter: (item: FilterChoice, type: FilterChoiceType) => void;
    showArchived: boolean;
    setShowArchived: (value: boolean) => void;
}
export function SearchFilter(props: Props) {
    const { addFilter, showArchived, setShowArchived } = props;
    const { showSearch, showSelected } = useSelectedFilters();
    const isMobile = useBreakpointValue({ base: true, md: false });

    const Stack = isMobile ? VStack : HStack;

    return (
        <FlexNav
            h={isMobile ? `${SEARCH_FILTER_MOBILE_HEIGHT}px` : `${NAV_HEIGHT}px`}
            mt={
                showSearch
                    ? showSelected
                        ? `${NAV_HEIGHT + SELECTED_FILTERS_HEIGHT}px`
                        : `${NAV_HEIGHT}px`
                    : isMobile
                      ? `${NAV_HEIGHT - SEARCH_FILTER_MOBILE_HEIGHT}px`
                      : '0px'
            }
            transition='margin-top 0.3s'
            zIndex={11}
            justifyContent='center'
        >
            <Stack spacing={isMobile ? 2 : 4}>
                <TagFilter addFilter={addFilter} />
                <IngredientFilter addFilter={addFilter} />
                {showSearch ? (
                    <ArchivedFilter showArchived={showArchived} setShowArchived={setShowArchived} />
                ) : undefined}
            </Stack>
        </FlexNav>
    );
}
