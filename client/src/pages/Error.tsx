import { Link, useRouteError } from 'react-router-dom';
import { Box, Button, Flex, Heading, Text } from '@chakra-ui/react';

import { PATH } from '../constants';

export function ErrorBoundary() {
    const error = useRouteError();

    if (error) {
        console.error(error);
    }

    return (
        <Flex direction='column' align='center' justify='center' height='100vh' bg='gray.50'>
            <Box textAlign='center'>
                <Heading as='h1' size='4xl' mb={4}>
                    404 Not Found
                </Heading>
                <Text fontSize='xl' mb={4}>
                    Sorry, the page you are looking for does not exist. Root path is {PATH.ROOT}.
                </Text>
                <Button as={Link} to={PATH.ROOT} colorScheme='teal' size='lg' fontWeight='normal'>
                    Back to homepage
                </Button>
            </Box>
        </Flex>
    );
}
