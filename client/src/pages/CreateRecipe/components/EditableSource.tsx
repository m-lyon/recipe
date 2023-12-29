import { Flex, Input, InputGroup, InputLeftAddon, Text } from '@chakra-ui/react';
import { Dispatch, SetStateAction } from 'react';

export interface EditableSourceProps {
    source: string;
    setSource: Dispatch<SetStateAction<string>>;
}
export function EditableSource(props: EditableSourceProps) {
    const { source, setSource } = props;
    return (
        <Flex direction={'row'} justifyContent={'space-between'}>
            <InputGroup justifyContent={'flex-end'}>
                <InputLeftAddon backgroundColor={'inherit'} border={'inhreit'} padding={0}>
                    <Text as={'i'} color={source ? undefined : 'gray.400'} fontWeight='medium'>
                        Source:
                    </Text>
                </InputLeftAddon>
                <Input
                    fontStyle={'italic'}
                    width={'25%'}
                    _focusVisible={{ outline: 'none' }}
                    border={'inherit'}
                    paddingLeft={2}
                    paddingRight={0}
                    value={source}
                    onChange={(e) => setSource(e.target.value)}
                />
            </InputGroup>
        </Flex>
    );
}
