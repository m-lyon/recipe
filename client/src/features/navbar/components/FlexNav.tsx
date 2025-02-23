import { Flex, FlexProps } from '@chakra-ui/react';

export function FlexNav({ children, ...props }: FlexProps) {
    return (
        <Flex
            as='nav'
            position='fixed'
            minH='60px'
            py={2}
            bg='white'
            px={4}
            borderBottom={1}
            borderStyle='solid'
            borderColor='gray.200'
            align='center'
            zIndex={12}
            w='100%'
            {...props}
        >
            {children}
        </Flex>
    );
}
