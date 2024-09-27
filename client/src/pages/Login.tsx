import { object, string } from 'yup';
import { motion } from 'framer-motion';
import { useMutation } from '@apollo/client';
import { useNavigate } from 'react-router-dom';
import { FormEvent, useEffect, useState } from 'react';
import { Box, Button, FormControl, HStack, Heading, Stack } from '@chakra-ui/react';

import { ROOT_PATH } from '@recipe/constants';
import { useUser } from '@recipe/features/user';
import { useErrorToast } from '@recipe/common/hooks';
import { CURRENT_USER } from '@recipe/graphql/queries/user';
import { LOGIN, SIGNUP } from '@recipe/graphql/mutations/user';
import { FloatingLabelInput } from '@recipe/common/components';

export function Login() {
    const { isLoggedIn } = useUser();
    const navigate = useNavigate();
    const toast = useErrorToast();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [firstName, setFirstName] = useState('');
    const [lastName, setLastName] = useState('');
    const [isSignup, setIsSignup] = useState(false);
    const [login, { loading: loginLoading }] = useMutation(LOGIN, {
        update: (cache, { data }) => {
            if (data?.login) {
                cache.writeQuery({
                    query: CURRENT_USER,
                    data: { currentUser: data.login },
                });
            } else {
                cache.writeQuery({
                    query: CURRENT_USER,
                    data: { currentUser: null },
                });
            }
        },
    });
    const [signup, { loading: SignupLoading }] = useMutation(SIGNUP, {
        update: (cache, { data }) => {
            if (data?.register) {
                cache.writeQuery({
                    query: CURRENT_USER,
                    data: { currentUser: data.register },
                });
            } else {
                cache.writeQuery({
                    query: CURRENT_USER,
                    data: { currentUser: null },
                });
            }
        },
    });

    const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        if (isSignup) {
            const formSchema = object({
                email: string().email().required(),
                password: string().required(),
                firstName: string().required(),
                lastName: string().required(),
            });
            try {
                const validated = await formSchema.validate({
                    email,
                    password,
                    firstName,
                    lastName,
                });
                await signup({ variables: { ...validated } });
            } catch (err) {
                if (err instanceof Error) {
                    console.error(err);
                    toast({ title: 'An error occurred.', description: err.message });
                }
            }
        } else {
            const formSchema = object({
                email: string().email().required(),
                password: string().required(),
            });
            try {
                const validated = await formSchema.validate({ email, password });
                await login({ variables: { ...validated } });
            } catch (err) {
                if (err instanceof Error) {
                    console.error(err);
                    toast({ title: 'An error occurred.', description: err.message });
                }
            }
        }
    };

    useEffect(() => {
        if (isLoggedIn) {
            navigate(ROOT_PATH);
        }
    }, [isLoggedIn, navigate]);

    return (
        <Box pt='60px'>
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                layout='size'
            >
                <Box maxW='md' mx='auto' mt={8} borderWidth='1px' borderRadius='lg' p={8}>
                    <form onSubmit={handleSubmit}>
                        <motion.div
                            key={isSignup ? 'signup-heading' : 'login-heading'}
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            transition={{ duration: 1 }}
                            layout='position'
                        >
                            <Heading mb={8}>{isSignup ? 'Sign Up' : 'Log In'}</Heading>
                        </motion.div>
                        {isSignup && (
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                layout='position'
                            >
                                <Stack
                                    mb={4}
                                    direction={{ base: 'column', md: 'row' }}
                                    spacing={{ base: 4, md: 4 }}
                                >
                                    <FormControl>
                                        <FloatingLabelInput
                                            id='first-name'
                                            label='First name'
                                            value={firstName}
                                            isInvalid={false}
                                            fontWeight={400}
                                            onChange={(e) => setFirstName(e.target.value)}
                                        />
                                    </FormControl>
                                    <FormControl>
                                        <FloatingLabelInput
                                            id='last-name'
                                            label='Surname'
                                            value={lastName}
                                            isInvalid={false}
                                            fontWeight={400}
                                            onChange={(e) => setLastName(e.target.value)}
                                        />
                                    </FormControl>
                                </Stack>
                            </motion.div>
                        )}
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            layout='position'
                        >
                            <FormControl>
                                <FloatingLabelInput
                                    id='email'
                                    label='Email'
                                    value={email}
                                    isInvalid={false}
                                    fontWeight={400}
                                    onChange={(e) => setEmail(e.target.value)}
                                />
                            </FormControl>
                            <FormControl mt={4}>
                                <FloatingLabelInput
                                    id='password'
                                    type='password'
                                    label='Password'
                                    value={password}
                                    isInvalid={false}
                                    fontWeight={400}
                                    onChange={(e) => setPassword(e.target.value)}
                                />
                            </FormControl>
                            <HStack mt={8}>
                                <Button
                                    mt={4}
                                    colorScheme='teal'
                                    isLoading={loginLoading || SignupLoading}
                                    type='submit'
                                    aria-label={isSignup ? 'Register' : 'Login'}
                                    isDisabled={
                                        !email ||
                                        !password ||
                                        (!firstName && isSignup) ||
                                        (!lastName && isSignup)
                                    }
                                >
                                    {isSignup ? 'Register' : 'Login'}
                                </Button>
                                <Button
                                    mt={4}
                                    colorScheme='teal'
                                    onClick={() => setIsSignup(!isSignup)}
                                    variant='outline'
                                >
                                    {isSignup ? 'Login' : 'Sign Up'}
                                </Button>
                            </HStack>
                        </motion.div>
                    </form>
                </Box>
            </motion.div>
        </Box>
    );
}
