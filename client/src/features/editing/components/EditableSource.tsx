import { Dispatch, SetStateAction } from 'react';
import { Text, VStack, useBreakpointValue } from '@chakra-ui/react';
import { Input, InputGroup, InputLeftAddon } from '@chakra-ui/react';

export interface EditableSourceProps {
    source: string;
    setSource: Dispatch<SetStateAction<string>>;
}
export function EditableSource(props: EditableSourceProps) {
    const { source, setSource } = props;
    const styles = useBreakpointValue(
        {
            base: {
                justifyContent: 'flex-start',
            },
            md: {
                justifyContent: 'flex-end',
            },
        },
        { fallback: 'md' }
    );
    return (
        <VStack width='100%' justifyContent='flex-end'>
            <InputGroup justifyContent={styles?.justifyContent}>
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
                    width='40%'
                    _focusVisible={{ outline: 'none' }}
                    border='inherit'
                    paddingLeft={2}
                    paddingRight={0}
                    value={source}
                    onChange={(e) => setSource(e.target.value)}
                    alignSelf='flex-end'
                    height='auto'
                />
            </InputGroup>
        </VStack>
    );
}
