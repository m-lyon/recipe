import { useLazyQuery } from '@apollo/client';
import { SearchIcon } from '@chakra-ui/icons';
import { useDebouncedCallback } from 'use-debounce';
import { Input, InputGroup, InputLeftElement } from '@chakra-ui/react';

import { UseSearchQuery } from '@recipe/features/navbar';
import { GET_RECIPES } from '@recipe/graphql/queries/recipe';
import { DEBOUNCE_TIME, INIT_LOAD_NUM } from '@recipe/constants';

export function SearchBar(props: UseSearchQuery) {
    const { setSearchQuery } = props;
    const [searchRecipes] = useLazyQuery(GET_RECIPES, { fetchPolicy: 'network-only' });
    const debounced = useDebouncedCallback((value: string) => {
        setSearchQuery(value);
        searchRecipes({
            variables: {
                offset: 0,
                limit: INIT_LOAD_NUM,
                filter: value
                    ? {
                          _operators: { title: { regex: `/${value}/i` } },
                      }
                    : undefined,
            },
        });
    }, DEBOUNCE_TIME);

    return (
        <InputGroup display='flex'>
            <InputLeftElement pointerEvents='none'>
                <SearchIcon color='gray.300' />
            </InputLeftElement>
            <Input
                placeholder='Find a recipe...'
                onChange={(e) => debounced(e.currentTarget.value)}
                aria-label='Search for recipes'
            />
        </InputGroup>
    );
}
