import { useQuery } from '@apollo/client';

import { CURRENT_USER } from '@recipe/graphql/queries/user';

export function useUser() {
    const { data, loading } = useQuery(CURRENT_USER);
    const isLoggedIn = !!data?.currentUser;
    const isAdmin = data?.currentUser?.role === 'admin';
    return { user: data?.currentUser, isLoggedIn, isAdmin, loading };
}
