import { HStack } from '@chakra-ui/react';

import { useSearchStore } from '@recipe/stores';
import { IngredientFilter, TagFilter } from '@recipe/features/search';

import { FlexNav } from './FlexNav';

interface Props {
    addFilter: (item: FilterChoice, type: FilterChoiceType) => void;
}
export function SearchFilter(props: Props) {
    const { addFilter } = props;
    const showSearch = useSearchStore((state) => state.showSearch);
    const showSelected = useSearchStore(
        (state) => state.selectedTags.length > 0 || state.selectedIngredients.length > 0
    );

    return (
        <FlexNav
            h='60px'
            mt={showSearch ? (showSelected ? '92px' : '60px') : '0px'}
            transition='margin-top 0.3s'
            zIndex={11}
            justifyContent='center'
        >
            <HStack spacing={4}>
                <TagFilter addFilter={addFilter} />
                <IngredientFilter addFilter={addFilter} />
            </HStack>
        </FlexNav>
    );
}
