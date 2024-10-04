import { useQuery } from '@apollo/client';

import { CURRENT_USER } from '@recipe/graphql/queries/user';

export function useUser() {
    const { data, loading } = useQuery(CURRENT_USER);
    const isLoggedIn = !!data?.currentUser;
    const isAdmin = data?.currentUser?.role === 'admin';
    const user = data?.currentUser ? data.currentUser : null;
    return { user, isLoggedIn, isAdmin, loading };
}
