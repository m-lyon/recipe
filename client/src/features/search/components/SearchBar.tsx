import { SearchIcon } from '@chakra-ui/icons';
import { Input, InputGroup, InputLeftElement } from '@chakra-ui/react';

import { SearchHook } from '../hooks/useSearch';

export function SearchBar(props: Omit<SearchHook, 'delayedSearchQuery'>) {
    const { searchQuery, onSearch } = props;

    return (
        <InputGroup>
            <InputLeftElement pointerEvents='none'>
                <SearchIcon color='gray.300' />
            </InputLeftElement>
            <Input
                placeholder='Find a recipe...'
                value={searchQuery}
                onChange={(e) => onSearch(e.currentTarget.value)}
                aria-label='Search for recipes'
            />
        </InputGroup>
    );
}
