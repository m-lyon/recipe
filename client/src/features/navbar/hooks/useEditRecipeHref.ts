import { useQuery } from '@apollo/client';
import { useMatch } from 'react-router-dom';

import { PATH } from '@recipe/constants';
import { GET_RECIPE } from '@recipe/graphql/queries/recipe';
import { hasEditPermission, useUser } from '@recipe/features/user';

export function useEditRecipeHref(): string | undefined {
    const match = useMatch(`${PATH.BASE}/view/recipe/:titleIdentifier`);
    const titleIdentifier = match?.params.titleIdentifier;
    const { user } = useUser();
    // The view recipe page fetches the recipe, so read it from the cache.
    const { data } = useQuery(GET_RECIPE, {
        variables: { filter: { titleIdentifier } },
        fetchPolicy: 'cache-only',
        skip: !titleIdentifier,
    });
    const recipe = data?.recipeOne;
    if (!recipe || !hasEditPermission(user, recipe.owner)) {
        return undefined;
    }
    return `${PATH.BASE}/edit/recipe/${titleIdentifier}`;
}
