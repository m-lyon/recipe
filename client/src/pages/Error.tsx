import { Box, Heading, Text, Flex, Button } from '@chakra-ui/react';
import { Link, useRouteError } from 'react-router-dom';

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
                    Sorry, the page you are looking for does not exist.
                </Text>
                <Button as={Link} to='/recipe' colorScheme='teal' size='lg' fontWeight='normal'>
                    Back to homepage
                </Button>
            </Box>
        </Flex>
    );
}
