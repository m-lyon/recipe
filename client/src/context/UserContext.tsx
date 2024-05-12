import { Dispatch, PropsWithChildren, SetStateAction, createContext, useState } from 'react';

import { LoginMutation } from '@recipe/graphql/generated';

export type IUserContext = Partial<LoginMutation['login']> | false;

const UserContext = createContext<[IUserContext, Dispatch<SetStateAction<IUserContext>>]>([
    null,
    () => {},
]);

function UserProvider(props: PropsWithChildren<unknown>) {
    const [state, setState] = useState<IUserContext>(null);
    return <UserContext.Provider value={[state, setState]}>{props.children}</UserContext.Provider>;
}

export { UserContext, UserProvider };
