import { Box, Heading, Text, Flex, Button } from '@chakra-ui/react';
import { Link } from 'react-router-dom';
import { ROOT_PATH } from '../constants';

export function Signup() {
    return (
        <Flex direction='column' align='center' justify='center' height='100vh' bg='gray.50'>
            <Box textAlign='center'>
                <Heading as='h1' size='4xl' mb={4}>
                    User accounts coming soon...
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
