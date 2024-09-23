import { useContext } from 'react';
import { Link } from 'react-router-dom';
import { useNavigate } from 'react-router-dom';
import { Button, Stack } from '@chakra-ui/react';
import { useMutation, useQuery } from '@apollo/client';

import { ROOT_PATH } from '@recipe/constants';
import { useErrorToast } from '@recipe/common/hooks';
import { LOGOUT } from '@recipe/graphql/mutations/user';
import { CURRENT_USER } from '@recipe/graphql/queries/user';

import { UserContext } from '../context/UserContext';

export function UserOptions() {
    const [userContext, setUserContext] = useContext(UserContext);
    const [logout] = useMutation(LOGOUT);
    const navigate = useNavigate();
    const toast = useErrorToast();
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
            toast({ title: 'An error occurred.', description: err.message });
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
                toast({ title: 'An error occurred.', description: err.message });
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
            >
                Sign In
            </Button>
        </Stack>
    );
}
