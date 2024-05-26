import { useContext } from 'react';
import { Navigate } from 'react-router-dom';

import { ROOT_PATH } from '@recipe/constants';

import { UserContext } from '../context/UserContext';

export function RequireAuth({ children }: { children: React.ReactNode }) {
    const [userContext] = useContext(UserContext);

    if (userContext === null) {
        return <div>Loading...</div>;
    }

    return userContext === false ? <Navigate to={ROOT_PATH} /> : children;
}
