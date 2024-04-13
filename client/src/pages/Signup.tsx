import { object, string } from 'yup';
import { useContext, useState } from 'react';
import { useMutation } from '@apollo/client';
import { useNavigate } from 'react-router-dom';
import { Box, Button, FormControl, HStack, Heading, Input, useToast } from '@chakra-ui/react';

import { SIGNUP } from '@recipe/graphql/mutations/user';

import { ROOT_PATH } from '../constants';
import { UserContext } from '../context/UserContext';

export function Signup() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [firstName, setFirstName] = useState('');
    const [lastName, setLastName] = useState('');
    const [signup, { loading }] = useMutation(SIGNUP);
    const navigate = useNavigate();
    const toast = useToast();
    const setUserContext = useContext(UserContext)[1];

    const formSchema = object({
        email: string().email().required(),
        password: string().required(),
        firstName: string().required(),
        lastName: string().required(),
    });

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        try {
            const validated = await formSchema.validate({ email, password, firstName, lastName });
            const { data } = await signup({ variables: { ...validated } });
            if (data?.register) {
                setUserContext(data.register);
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
                <Heading>Sign Up</Heading>
                <HStack mt={8}>
                    <FormControl>
                        <Input
                            type='text'
                            placeholder='First name'
                            value={firstName}
                            onChange={(e) => setFirstName(e.target.value)}
                        />
                    </FormControl>
                    <FormControl>
                        <Input
                            type='text'
                            value={lastName}
                            placeholder='Surname'
                            onChange={(e) => setLastName(e.target.value)}
                        />
                    </FormControl>
                </HStack>
                <FormControl mt={4}>
                    <Input
                        type='email'
                        value={email}
                        placeholder='Email'
                        onChange={(e) => setEmail(e.target.value)}
                    />
                </FormControl>
                <FormControl mt={4}>
                    <Input
                        type='password'
                        placeholder='Password'
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                    />
                </FormControl>
                <Button
                    mt={4}
                    colorScheme='teal'
                    isLoading={loading}
                    type='submit'
                    isDisabled={!email || !password || !firstName || !lastName}
                >
                    {loading ? 'Registering...' : 'Register'}
                </Button>
            </form>
        </Box>
    );
}
