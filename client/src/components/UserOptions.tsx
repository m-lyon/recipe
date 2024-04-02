import { Button, Stack, useToast } from '@chakra-ui/react';
import { useContext } from 'react';
import { useMutation, useQuery } from '@apollo/client';
import { useNavigate } from 'react-router-dom';

import { UserContext } from '../context/UserContext';
import { ROOT_PATH } from '../constants';
import { LOGOUT } from '../graphql/mutations/user';
import { CURRENT_USER } from '../graphql/queries/user';

export function UserOptions() {
    const [userContext, setUserContext] = useContext(UserContext);
    const [logout] = useMutation(LOGOUT);
    const navigate = useNavigate();
    const toast = useToast();
    const { loading } = useQuery(CURRENT_USER, {
        pollInterval: 1000 * 60 * 5,
        onCompleted: (data) => {
            if (!data.currentUser) {
                setUserContext(false);
            } else {
                setUserContext(data.currentUser);
            }
        },
        onError: (err) => {
            console.log(err);
            toast({
                title: 'An error occurred.',
                description: err.message,
                status: 'error',
                duration: 9000,
                isClosable: true,
            });
        },
    });

    const handleLogout = async () => {
        try {
            const { data } = await logout();
            if (data) {
                setUserContext(false);
                navigate(ROOT_PATH);
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
    if (loading) {
        return <LoginOptions />;
    }
    if (userContext) {
        return (
            <Stack flex={{ base: 1, md: 0 }} justify='flex-end' direction='row' spacing={6}>
                <Button fontSize='sm' fontWeight={400} onClick={handleLogout}>
                    Logout
                </Button>
            </Stack>
        );
    }
    return <LoginOptions />;
}

function LoginOptions() {
    return (
        <Stack flex={{ base: 1, md: 0 }} justify='flex-end' direction='row' spacing={6}>
            <Button
                as='a'
                fontSize='sm'
                fontWeight={400}
                variant='link'
                href={`${ROOT_PATH}/login`}
            >
                Sign In
            </Button>
            <Button
                as='a'
                display={{ base: 'none', md: 'inline-flex' }}
                fontSize='sm'
                fontWeight={600}
                colorScheme='teal'
                href={`${ROOT_PATH}/signup`}
            >
                Sign Up
            </Button>
        </Stack>
    );
}
