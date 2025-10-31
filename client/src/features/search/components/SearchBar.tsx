
import { CloseButton, Input, InputGroup, InputLeftElement } from '@chakra-ui/react';

import { useSearchStore } from '@recipe/stores';

interface Props {
    setTitleFilter: (value: string) => void;
    resetSearch: () => void;
    closeNavDropdown: () => void;
}
export function SearchBar(props: Props) {
    const { setTitleFilter, resetSearch, closeNavDropdown } = props;
    const titleFilter = useSearchStore((state) => state.titleFilter);
    const show = useSearchStore((state) => state.showSearch);
    const setShow = useSearchStore((state) => state.setShowSearch);

    return (
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
    );
}
