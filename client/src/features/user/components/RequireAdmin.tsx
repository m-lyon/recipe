import { Navigate, Outlet } from 'react-router-dom';

import { PATH } from '@recipe/constants';

import { useUser } from '../hooks/useUser';

export function RequireAdmin() {
    const { isAdmin, loading } = useUser();

    if (loading) {
        return <div>Loading...</div>;
    }

    return isAdmin ? <Outlet /> : <Navigate to={PATH.ROOT} />;
}
