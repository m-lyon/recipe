import { useState, createContext, Dispatch, SetStateAction } from 'react';
import { LoginMutation } from '../__generated__/graphql';

type UserContextType = Partial<LoginMutation['login']>;

const UserContext = createContext<[UserContextType, Dispatch<SetStateAction<UserContextType>>]>([
    null,
    () => {},
]);

function UserProvider(props: any) {
    const [state, setState] = useState<UserContextType>(null);
    return <UserContext.Provider value={[state, setState]}>{props.children}</UserContext.Provider>;
}

export { UserContext, UserProvider };
