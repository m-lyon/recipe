import { useState, useContext } from 'react';
import { useMutation } from '@apollo/client';
import { gql } from '../../__generated__';
import { UserContext } from '../../context/UserContext';
import { useNavigate } from 'react-router-dom';
import { FormControl, FormLabel, Input, Button, Box, useToast } from '@chakra-ui/react';
import { ROOT_PATH } from '../../constants';

export const LOGIN_MUTATION = gql(`
    mutation Login($email: String!, $password: String!) {
        login(username: $email, password: $password) {
            _id
            role
            firstName
            lastName
        }
    }
`);

export const IS_LOGGED_IN = gql(`
    query IsLoggedIn {
        currentUser {
            _id
            username
            role
        }
    }
`);

export function Login() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [login, { loading }] = useMutation(LOGIN_MUTATION);
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
