import { useQuery } from '@apollo/client';

import { CURRENT_USER } from '@recipe/graphql/queries/user';

export function useUser() {
    const { data, loading } = useQuery(CURRENT_USER);

    if (loading || !data || !data.currentUser) {
        return { loading, isLoggedIn: false, isAdmin: false, user: null, isVerified: false };
    }
    const isAdmin = data.currentUser.role === 'admin';
    const isVerified = data.currentUser.role !== 'unverified';
    return { user: data.currentUser, isLoggedIn: true, isAdmin, loading, isVerified };
}
