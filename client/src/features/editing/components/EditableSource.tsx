import { useShallow } from 'zustand/shallow';
import { Input, InputGroup, InputLeftAddon, Text, VStack } from '@chakra-ui/react';

import { useRecipeStore } from '@recipe/stores';

export function EditableSource() {
    const { source, setSource } = useRecipeStore(
        useShallow((state) => ({
            source: state.source,
            setSource: state.setSource,
        }))
    );
    return (
        <VStack width='100%' justifyContent='flex-end'>
            <InputGroup justifyContent={{ base: 'flex-start', md: 'flex-end' }}>
                <InputLeftAddon backgroundColor='inherit' border='inhreit' padding={0}>
                    <Text
                        as='i'
                        color={source ? undefined : 'gray.400'}
                        fontWeight='medium'
                        alignSelf='flex-end'
                        height='auto'
                    >
                        Source:
                    </Text>
                </InputLeftAddon>
                <Input
                    fontStyle='italic'
                    fontWeight='medium'
                    width='40%'
                    _focusVisible={{ outline: 'none' }}
                    border='inherit'
                    paddingLeft={2}
                    paddingRight={0}
                    value={source}
                    onChange={(e) => setSource(e.target.value)}
                    alignSelf='flex-end'
                    height='auto'
                    aria-label='Edit recipe source'
                />
            </InputGroup>
        </VStack>
    );
}
