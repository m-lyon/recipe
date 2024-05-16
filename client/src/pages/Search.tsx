import { Link } from 'react-router-dom';
import { Box, Button, Flex, Heading, Text } from '@chakra-ui/react';

import { ROOT_PATH } from '../constants';

export function Search() {
    return (
        <Flex direction='column' align='center' justify='center' height='100vh' bg='gray.50'>
            <Box textAlign='center'>
                <Heading as='h1' size='4xl' mb={4}>
                    Search coming soon...
                </Heading>
                <Text fontSize='xl' mb={4}>
                    Keep an eye on this space 👀
                </Text>
                <Button as={Link} to={ROOT_PATH} colorScheme='teal' size='lg' fontWeight='normal'>
                    Back to homepage
                </Button>
            </Box>
        </Flex>
    );
}
