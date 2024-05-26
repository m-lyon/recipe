import { useContext, useState } from 'react';
import { useMutation } from '@apollo/client';
import { useNavigate } from 'react-router-dom';
import { Box, Button, FormControl, FormLabel, Input, useToast } from '@chakra-ui/react';

import { LOGIN } from '@recipe/graphql/mutations/user';

import { ROOT_PATH } from '../constants';
import { UserContext } from '../features/user/context/UserContext';

export function Login() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [login, { loading }] = useMutation(LOGIN);
    const navigate = useNavigate();
    const toast = useToast();
    const setUserContext = useContext(UserContext)[1];

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        try {
            const { data } = await login({ variables: { email, password } });
            if (data?.login) {
                setUserContext(data.login);
                navigate(ROOT_PATH);
            } else {
                setUserContext(false);
            }
        } catch (err) {
            if (err instanceof Error) {
                console.error(err);
                toast({
                    title: 'An error occurred.',
                    description: err.message,
                    status: 'error',
                    duration: 9000,
                    isClosable: true,
                });
            }
        }
    };

    return (
        <Box maxW='md' mx='auto' mt={8} borderWidth='1px' borderRadius='lg' p={8}>
            <form onSubmit={handleSubmit}>
                <FormControl>
                    <FormLabel>Email</FormLabel>
                    <Input type='email' value={email} onChange={(e) => setEmail(e.target.value)} />
                </FormControl>
                <FormControl mt={4}>
                    <FormLabel>Password</FormLabel>
                    <Input
                        type='password'
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                    />
                </FormControl>
                <Button
                    mt={4}
                    colorScheme='teal'
                    isLoading={loading}
                    type='submit'
                    isDisabled={!email || !password}
                >
                    {loading ? 'Loading...' : 'Login'}
                </Button>
            </form>
        </Box>
    );
}
