import { Stack, Button } from '@chakra-ui/react';
import { useContext } from 'react';
import { UserContext } from '../context/UserContext';
import { gql } from '../__generated__';
import { useMutation, useQuery } from '@apollo/client';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@chakra-ui/react';

export const LOGOUT_MUTATION = gql(`
    mutation Logout {
        logout
    }
`);
export const CURRENT_USER_QUERY = gql(`
    query CurrentUser {
        currentUser {
            _id
            role
            firstName
            lastName
        }
    }
`);

export function UserOptions() {
    const [userContext, setUserContext] = useContext(UserContext);
    const [logout] = useMutation(LOGOUT_MUTATION);
    const navigate = useNavigate();
    const toast = useToast();
    const { loading } = useQuery(CURRENT_USER_QUERY, {
        pollInterval: 1000 * 60 * 5,
        onCompleted: (data) => {
            if (!data.currentUser) {
                setUserContext(false);
            } else {
                setUserContext(data.currentUser);
            }
        },
        onError: (err) => {
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
                navigate('/recipe');
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
        return null;
    }
    if (userContext) {
        return (
            <Stack flex={{ base: 1, md: 0 }} justify={'flex-end'} direction={'row'} spacing={6}>
                <Button fontSize={'sm'} fontWeight={400} onClick={handleLogout}>
                    Logout
                </Button>
            </Stack>
        );
    } else {
        return (
            <Stack flex={{ base: 1, md: 0 }} justify={'flex-end'} direction={'row'} spacing={6}>
                <Button
                    as={'a'}
                    fontSize={'sm'}
                    fontWeight={400}
                    variant={'link'}
                    href={'/recipe/login'}
                >
                    Sign In
                </Button>
                <Button
                    as={'a'}
                    display={{ base: 'none', md: 'inline-flex' }}
                    fontSize={'sm'}
                    fontWeight={600}
                    colorScheme='teal'
                    href={'/recipe/signup'}
                >
                    Sign Up
                </Button>
            </Stack>
        );
    }
}
