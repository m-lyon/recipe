import { Navigate, Outlet } from 'react-router-dom';

import { PATH } from '@recipe/constants';

import { useUser } from '../hooks/useUser';

export function RequireAuth() {
    const { isVerified, loading } = useUser();

    if (loading) {
        return <div>Loading...</div>;
    }

    return isVerified ? <Outlet /> : <Navigate to={PATH.ROOT} />;
}
