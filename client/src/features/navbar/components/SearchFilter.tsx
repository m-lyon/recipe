import { KeyboardEvent, useRef } from 'react';
import { useDropdown } from 'common/hooks/useDropdown';
import { Box, HStack, Input, VStack } from '@chakra-ui/react';

import { useSearchStore } from '@recipe/stores';
import { TagDropdown } from '@recipe/features/tags';
import { useTagSuggestions } from '@recipe/features/tags';

import { FlexNav } from './FlexNav';

export function SearchFilter() {
    const showSearch = useSearchStore((state) => state.showSearch);
    const tagListRef = useRef<HTMLUListElement>(null);
    const hasSelections = useSearchStore((state) => state.selectedTags.length > 0);
    const selectedTags = useSearchStore((state) => state.selectedTags);
    console.log('selectedTags', selectedTags);
    const isOpen = useSearchStore((state) => state.showTagDropdown);
    const tagFilter = useSearchStore((state) => state.tagFilter);
    const tags = useSearchStore((state) => state.selectedTags);
    const setTagFilter = useSearchStore((state) => state.setTagFilter);
    const setIsOpen = useSearchStore((state) => state.setShowTagDropdown);
    const addTag = useSearchStore((state) => state.addTag);
    const suggestions = useTagSuggestions(tags, tagFilter);
    const { active, handleSetActive, handleKeyboardEvent } = useDropdown(suggestions, tagListRef);
    const onKeyDown = (e: KeyboardEvent) => handleKeyboardEvent(e, addTag);
    return (
        <FlexNav
            mt={showSearch ? (hasSelections ? '120px' : '60px') : '0px'}
            transition='margin-top 0.3s'
            zIndex={11}
            justifyContent='center'
        >
            <VStack>
                <HStack spacing={4}></HStack>
                <HStack spacing={4}>
                    <Box w='100%' position='relative'>
                        <Input
                            placeholder='Filter by tags'
                            value={tagFilter}
                            onChange={(e) => setTagFilter(e.currentTarget.value)}
                            onKeyDown={onKeyDown}
                            onFocus={() => setIsOpen(true)}
                            onBlur={() => setIsOpen(false)}
                            aria-label='Filter by tags'
                            mb='1px'
                        />
                        <TagDropdown
                            active={active}
                            handleSetActive={handleSetActive}
                            handleSelect={addTag}
                            isOpen={isOpen}
                            width='100%'
                            suggestions={suggestions}
                            listRef={tagListRef}
                        />
                    </Box>
                    <Input
                        placeholder='Filter by ingredients'
                        // value=''
                        // onChange={(e) => onSearch(e.currentTarget.value)}
                        // onFocus={() => {
                        //     setShow(true);
                        //     closeNavDropdown();
                        // }}
                        aria-label='Filter by ingredients'
                    />
                </HStack>
            </VStack>
        </FlexNav>
    );
}
