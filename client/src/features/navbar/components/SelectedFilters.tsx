import { useShallow } from 'zustand/shallow';
import { HStack, Tag, TagCloseButton, TagLabel } from '@chakra-ui/react';

import { useSearchStore } from '@recipe/stores';

import { FlexNav } from './FlexNav';

interface Props {
    removeFilter: (id: string) => void;
}
export function SelectedFilters(props: Props) {
    const { removeFilter } = props;
    const showSearch = useSearchStore((state) => state.showSearch);
    const showSelected = useSearchStore(
        (state) => state.selectedTags.length > 0 || state.selectedIngredients.length > 0
    );
    const items = useSearchStore(
        useShallow((state) => [...state.selectedTags, ...state.selectedIngredients])
    );

    return (
        <FlexNav
            mt={showSearch && showSelected ? '60px' : '0px'}
            transition='margin-top 0.3s'
            zIndex={11}
            justifyContent='center'
            minH='32px'
            maxH='32px'
            borderBottom={0}
            pb={0}
        >
            <HStack spacing={4}>
                {items.map((item) => (
                    <Tag key={item._id}>
                        <TagLabel>{item.value}</TagLabel>
                        <TagCloseButton
                            onClick={() => removeFilter(item._id)}
                            aria-label={`Remove ${item.value} filter`}
                        />
                    </Tag>
                ))}
            </HStack>
        </FlexNav>
    );
}
