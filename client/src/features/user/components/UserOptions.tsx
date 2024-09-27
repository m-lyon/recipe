import { Link } from 'react-router-dom';
import { useNavigate } from 'react-router-dom';
import { Button, Stack } from '@chakra-ui/react';
import { useMutation, useQuery } from '@apollo/client';

import { ROOT_PATH } from '@recipe/constants';
import { useErrorToast } from '@recipe/common/hooks';
import { LOGOUT } from '@recipe/graphql/mutations/user';
import { CURRENT_USER } from '@recipe/graphql/queries/user';

export function UserOptions() {
    const { data, loading } = useQuery(CURRENT_USER, {
        pollInterval: 1000 * 60 * 5,
        onError: (err) => {
            console.log(err);
            toast({ title: 'An error occurred.', description: err.message });
        },
    });
    const [logout] = useMutation(LOGOUT, {
        onError: (err) => {
            console.log(err);
            toast({ title: 'An error occurred.', description: err.message });
        },
        onCompleted: () => {
            navigate(ROOT_PATH);
        },
        update: (cache) => {
            cache.writeQuery({
                query: CURRENT_USER,
                data: { currentUser: null },
            });
        },
    });
    const navigate = useNavigate();
    const toast = useErrorToast();

    if (loading) {
        return <LoginOptions />;
    }
    if (data?.currentUser) {
        return (
            <Stack
                flex={{ base: 1, md: 0 }}
                justify='flex-end'
                direction='row'
                spacing={6}
                ml={{ base: 3, md: 0 }}
            >
                <Button fontSize='sm' fontWeight={400} onClick={() => logout()} aria-label='Logout'>
                    Logout
                </Button>
            </Stack>
        );
    }
    return <LoginOptions />;
}

function LoginOptions() {
    return (
        <Stack
            flex={{ base: 1, md: 0 }}
            justify='flex-end'
            direction='row'
            spacing={6}
            ml={{ base: 3, md: 0 }}
        >
            <Button
                as={Link}
                fontSize='sm'
                fontWeight={600}
                colorScheme='teal'
                to={`${ROOT_PATH}/login`}
                aria-label='Log in or sign up'
            >
                Sign In
            </Button>
        </Stack>
    );
}
