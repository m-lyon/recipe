import { useState, createContext, Dispatch, SetStateAction } from 'react';

import { LoginMutation } from '../__generated__/graphql';

export type IUserContext = Partial<LoginMutation['login']> | false;

const UserContext = createContext<[IUserContext, Dispatch<SetStateAction<IUserContext>>]>([
    null,
    () => {},
]);

function UserProvider(props: any) {
    const [state, setState] = useState<IUserContext>(null);
    return <UserContext.Provider value={[state, setState]}>{props.children}</UserContext.Provider>;
}

export { UserContext, UserProvider };
