import { SearchIcon } from '@chakra-ui/icons';
import { Switch, Tooltip } from '@mantine/core';
import { InputLeftElement } from '@chakra-ui/react';
import { CloseButton, HStack, Input, InputGroup } from '@chakra-ui/react';

import { useSearchStore } from '@recipe/stores';

interface Props {
    setTitleFilter: (value: string) => void;
    resetSearch: () => void;
    closeNavDropdown: () => void;
    showArchived: boolean;
    setShowArchived: (v: boolean) => void;
}
export function SearchBar(props: Props) {
    const { setTitleFilter, resetSearch, closeNavDropdown, showArchived, setShowArchived } = props;
    const titleFilter = useSearchStore((state) => state.titleFilter);
    const show = useSearchStore((state) => state.showSearch);
    const setShow = useSearchStore((state) => state.setShowSearch);

    return (
        <HStack spacing={3} w='100%'>
            <InputGroup>
                <InputLeftElement pointerEvents={show ? 'auto' : 'none'}>
                    {show ? (
                        <CloseButton onClick={resetSearch} aria-label='Reset search' />
                    ) : (
                        <SearchIcon color='gray.300' />
                    )}
                </InputLeftElement>
                <Input
                    placeholder='Find a recipe...'
                    value={titleFilter}
                    onChange={(e) => setTitleFilter(e.currentTarget.value)}
                    onFocus={() => {
                        setShow(true);
                        closeNavDropdown();
                    }}
                    aria-label='Search for recipes'
                />
            </InputGroup>
            <Tooltip
                label={showArchived ? 'Hide archived recipes' : 'Show archived recipes'}
                openDelay={500}
                refProp='rootRef'
            >
                <Switch
                    id='archive-toggle'
                    size='lg'
                    color='#319795'
                    checked={showArchived}
                    onChange={(e) => setShowArchived(e.target.checked)}
                    aria-label='Toggle archived recipes view'
                    withThumbIndicator={false}
                />
            </Tooltip>
        </HStack>
    );
}
