import { object, string } from 'yup';
import { useMutation } from '@apollo/client';
import { useNavigate } from 'react-router-dom';
import { FormEvent, useContext, useState } from 'react';
import { Box, Button, FormControl, HStack, Heading, Input } from '@chakra-ui/react';

import { ROOT_PATH } from '@recipe/constants';
import { UserContext } from '@recipe/features/user';
import { useErrorToast } from '@recipe/common/hooks';
import { SIGNUP } from '@recipe/graphql/mutations/user';

export function Signup() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [firstName, setFirstName] = useState('');
    const [lastName, setLastName] = useState('');
    const [signup, { loading }] = useMutation(SIGNUP);
    const navigate = useNavigate();
    const toast = useErrorToast();
    const setUserContext = useContext(UserContext)[1];

    const formSchema = object({
        email: string().email().required(),
        password: string().required(),
        firstName: string().required(),
        lastName: string().required(),
    });

    const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
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
                toast({ title: 'An error occurred.', description: err.message });
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
