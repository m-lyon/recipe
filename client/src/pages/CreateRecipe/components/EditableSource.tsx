import { Input, InputGroup, InputLeftAddon, Text, VStack } from '@chakra-ui/react';
import { Dispatch, SetStateAction } from 'react';

export interface EditableSourceProps {
    source: string;
    setSource: Dispatch<SetStateAction<string>>;
}
export function EditableSource(props: EditableSourceProps) {
    const { source, setSource } = props;
    return (
        <VStack width='100%' justifyContent='flex-end'>
            <InputGroup justifyContent={'flex-end'}>
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
