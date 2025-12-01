import { useQuery } from '@apollo/client';
import { Stack, Text } from '@mantine/core';

import { PATH } from '@recipe/constants';
import { AnimatedLink } from '@recipe/common/components';
import { GET_LINKED_RECIPES } from '@recipe/graphql/queries/recipe';

interface Props {
    recipeId: string;
}

export function UsedIn(props: Props) {
    const { recipeId } = props;
    const { data, loading } = useQuery(GET_LINKED_RECIPES, {
        variables: { ingredientId: recipeId },
    });

    if (loading || !data?.recipeMany || data.recipeMany.length === 0) {
        return null;
    }

    return (
        <Stack gap='xs'>
            <Text size='24px' fw={700}>
                Used in
            </Text>
            <Stack gap={3}>
                {data.recipeMany.map((recipe) => (
                    <AnimatedLink
                        key={recipe._id}
                        to={`${PATH.ROOT}/view/recipe/${recipe.titleIdentifier}`}
                        size='md'
                        fw={700}
                        c='rgba(0, 0, 0, 0.64)'
                    >
                        {recipe.title}
                    </AnimatedLink>
                ))}
            </Stack>
        </Stack>
    );
}
