import { useLazyQuery } from '@apollo/client';
import { SearchIcon } from '@chakra-ui/icons';
import { useDebouncedCallback } from 'use-debounce';
import { Input, InputGroup, InputLeftElement } from '@chakra-ui/react';

import { INIT_LOAD_NUM } from '@recipe/constants';
import { UseSearchQuery } from '@recipe/features/navbar';
import { GET_RECIPES } from '@recipe/graphql/queries/recipe';

export function SearchBar(props: UseSearchQuery) {
    const { searchQuery, setSearchQuery } = props;
    const [searchRecipes] = useLazyQuery(GET_RECIPES, {
        fetchPolicy: 'network-only',
        onCompleted: (data) => {
            console.log(data);
        },
    });
    const debounced = useDebouncedCallback((value: string) => {
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
    });

    return (
        <InputGroup display='flex'>
            <InputLeftElement pointerEvents='none'>
                <SearchIcon color='gray.300' />
            </InputLeftElement>
            <Input
                value={searchQuery}
                placeholder='Find a recipe...'
                onChange={(e) => {
                    setSearchQuery(e.currentTarget.value);
                    debounced(e.currentTarget.value);
                }}
            />
        </InputGroup>
    );
}
