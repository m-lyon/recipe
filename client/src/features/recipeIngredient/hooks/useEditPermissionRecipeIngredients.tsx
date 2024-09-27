import { TypedDocumentNode, useLazyQuery, useQuery } from '@apollo/client';

import { CURRENT_USER } from '@recipe/graphql/queries/user';

export function useEditPermissionRecipeIngredients<T extends TypedDocumentNode<any, any>>(
    query: T
): { data: T extends TypedDocumentNode<infer Q, any> ? Q | undefined : never } {
    const [getItems, { data }] = useLazyQuery(query);

    useQuery(CURRENT_USER, {
        onCompleted: (data) => {
            if (data.currentUser) {
                const { role, _id } = data.currentUser;
                const filter = role === 'admin' ? {} : { owner: _id };
                getItems({ variables: { filter } });
            }
        },
    });

    return { data };
}
