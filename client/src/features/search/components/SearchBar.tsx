import { SearchIcon } from '@chakra-ui/icons';
import { CloseButton, Input, InputGroup, InputLeftElement } from '@chakra-ui/react';

import { useSearchStore } from '@recipe/stores';

import { SearchHook } from '../hooks/useSearch';
interface Props extends Omit<SearchHook, 'showSearch'> {
    closeNavDropdown: () => void;
}
export function SearchBar(props: Props) {
    const { searchQuery, onSearch, resetSearch, closeNavDropdown } = props;
    const show = useSearchStore((state) => state.showSearch);
    const setShow = useSearchStore((state) => state.setShowSearch);

    return (
        <InputGroup>
            <InputLeftElement pointerEvents={show ? 'auto' : 'none'}>
                {show ? <CloseButton onClick={resetSearch} /> : <SearchIcon color='gray.300' />}
            </InputLeftElement>
            <Input
                placeholder='Find a recipe...'
                value={searchQuery}
                onChange={(e) => onSearch(e.currentTarget.value)}
                onFocus={() => {
                    setShow(true);
                    closeNavDropdown();
                }}
                aria-label='Search for recipes'
            />
        </InputGroup>
    );
}
