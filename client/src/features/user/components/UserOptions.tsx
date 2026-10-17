import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button, Stack } from '@chakra-ui/react';
import { Link, useLocation } from 'react-router-dom';
import { useApolloClient, useMutation, useQuery } from '@apollo/client';

import { PATH } from '@recipe/constants';
import { useErrorToast } from '@recipe/common/hooks';
import { LOGOUT } from '@recipe/graphql/mutations/user';
import { CURRENT_USER } from '@recipe/graphql/queries/user';

export function UserOptions() {
    const { data, loading, error } = useQuery(CURRENT_USER, {
        pollInterval: 1000 * 60 * 5,
    });
    const [logout] = useMutation(LOGOUT, {
        onError: (err) => {
            console.log(err);
            toast({ title: 'An error occurred.', description: err.message });
        },
        onCompleted: () => {
            navigate(PATH.ROOT);
            // Cached results depend on who is logged in (e.g. the units they can edit).
            client.resetStore().catch(console.error);
        },
        update: (cache) => {
            cache.writeQuery({
                query: CURRENT_USER,
                data: { __typename: 'Query', currentUser: null },
            });
        },
    });
    const client = useApolloClient();
    const navigate = useNavigate();
    const toast = useErrorToast();

    // An effect, not the query's onError option, which Apollo has deprecated.
    useEffect(() => {
        if (!error) return;
        console.log(error);
        toast({ title: 'An error occurred.', description: error.message });
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [error]);

    if (loading) {
        return <LoginOptions isLoading={true} />;
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

function LoginOptions(props: { isLoading?: boolean }) {
    const location = useLocation();
    const { isLoading } = props;
    return (
        <Stack
            flex={{ base: 1, md: 0 }}
            justify='flex-end'
            direction='row'
            spacing={6}
            ml={{ base: 3, md: 0 }}
            display={location.pathname === PATH.LOGIN ? 'none' : undefined}
        >
            <Button
                as={Link}
                fontSize='sm'
                isLoading={isLoading}
                fontWeight={600}
                colorScheme='teal'
                to={PATH.LOGIN}
                aria-label='Log in or sign up'
            >
                Sign In
            </Button>
        </Stack>
    );
}
