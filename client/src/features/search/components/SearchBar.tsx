import { SearchIcon } from '@chakra-ui/icons';
import { InputLeftElement, Switch } from '@chakra-ui/react';
import { CloseButton, FormControl, FormLabel, HStack, Input, InputGroup } from '@chakra-ui/react';

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
            {!showArchived && (
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
            )}
            <FormControl display='flex' alignItems='center' w='auto' flexShrink={0}>
                <FormLabel htmlFor='archive-toggle' mb='0' fontSize='sm' whiteSpace='nowrap'>
                    Show archived
                </FormLabel>
                <Switch
                    id='archive-toggle'
                    isChecked={showArchived}
                    onChange={(e) => setShowArchived(e.target.checked)}
                    aria-label='Toggle archived recipes view'
                />
            </FormControl>
        </HStack>
    );
}
