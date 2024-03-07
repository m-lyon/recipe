import { useContext } from 'react';
import { UserContext } from './context/UserContext';
import { Navigate } from 'react-router-dom';
import { ROOT_PATH } from './constants';

export function RequireAuth({ children }: { children: React.ReactNode }) {
    const [userContext] = useContext(UserContext);

    if (userContext === null) {
        return <div>Loading...</div>;
    }

    return userContext === false ? <Navigate to={ROOT_PATH} /> : children;
}
