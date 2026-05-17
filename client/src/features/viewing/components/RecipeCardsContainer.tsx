import { useState } from 'react';
import { Box } from '@chakra-ui/react';
import { useMutation, useQuery } from '@apollo/client';
import { notifications } from '@mantine/notifications';
import InfiniteScroll from 'react-infinite-scroll-component';
import Masonry, { ResponsiveMasonry } from 'react-responsive-masonry';

import { useUser } from '@recipe/features/user';
import { useSearch } from '@recipe/features/search';
import { GET_RECIPES } from '@recipe/graphql/queries/recipe';
import { ARCHIVE_RECIPE } from '@recipe/graphql/mutations/recipe';
import { FETCH_MORE_NUM, INIT_LOAD_NUM } from '@recipe/constants';
import { ConfirmArchiveModal, archiveRecipeCache } from '@recipe/features/editing';

import { RecipeCard } from './RecipeCard';
import { ImageRecipeCard } from './ImageRecipeCard';

function hasPermission(user: CurrentUser, recipe: RecipePreview): boolean {
    if (!user) {
        return false;
    }
    return user._id === recipe.owner || user.role === 'admin';
}

const gutter = 24;
const padding = 24;
const cardWidth = 288;
const getBreakpointWidths = (columns: number): number => {
    return columns * cardWidth + (columns - 1) * gutter + padding * 2;
};
const generateBreakPoints = (maxColumns: number): { [key: number]: number } => {
    const breakpoints: { [key: number]: number } = {};
    for (let columns = 1; columns <= maxColumns; columns++) {
        breakpoints[getBreakpointWidths(columns)] = columns;
    }
    return breakpoints;
};
const breakPoints: { [key: number]: number } = generateBreakPoints(4);

const defaultFilter = { archived: false, originalRecipe: null };

export function RecipeCardsContainer() {
    const {
        data: recipeData,
        loading,
        error,
        fetchMore,
    } = useQuery(GET_RECIPES, {
        variables: {
            offset: 0,
            limit: INIT_LOAD_NUM,
            filter: defaultFilter,
            countFilter: defaultFilter,
        },
    });
    const [show, setShow] = useState(false);
    const [recipeId, setRecipeId] = useState('');
    const { user } = useUser();
    const { filter } = useSearch();
    const [archiveRecipe] = useMutation(ARCHIVE_RECIPE, {
        onError(error) {
            notifications.show({
                color: 'red',
                title: 'Archive failed',
                message: error.message,
            });
        },
        update(cache, { data: mutationData }) {
            const recordId = mutationData?.recipeArchiveById?.recordId;
            if (!recordId) {
                return;
            }

            const archivedRecipe = recipeData?.recipeMany.find((recipe) => recipe._id === recordId);
            if (!archivedRecipe) {
                return;
            }

            archiveRecipeCache(cache, archivedRecipe);
        },
    });

    const handleArchive = (id: string) => {
        setRecipeId(id);
        setShow(true);
    };

    const handleConfirmArchive = async () => {
        await archiveRecipe({ variables: { id: recipeId } });
    };

    if (loading) {
        return <div>Loading...</div>;
    }

    if (error || !recipeData) {
        return <div>Error: {error?.message}</div>;
    }

    const recipes = recipeData.recipeMany;

    const recipeCards = recipes.map((recipe) => {
        if (recipe.images && recipe.images.length > 0) {
            return (
                <ImageRecipeCard
                    recipe={recipe}
                    hasEditPermission={hasPermission(user, recipe)}
                    handleArchive={handleArchive}
                />
            );
        }
        return (
            <RecipeCard
                recipe={recipe}
                hasEditPermission={hasPermission(user, recipe)}
                handleArchive={handleArchive}
            />
        );
    });

    return (
        <InfiniteScroll
            dataLength={recipes.length}
            next={() => {
                fetchMore({
                    variables: {
                        offset: recipes.length,
                        limit: FETCH_MORE_NUM,
                        filter,
                        countFilter: filter,
                    },
                });
            }}
            hasMore={recipeData.recipeCount ? recipeData.recipeCount > recipes.length : false}
            loader={<h4 style={{ textAlign: 'center' }}>Loading...</h4>}
        >
            <ResponsiveMasonry
                columnsCountBreakPoints={breakPoints}
                style={{ padding: `${padding}px` }}
            >
                <Masonry gutter={`${gutter}px`}>
                    {recipeCards.map((card, index) => (
                        <Box key={index}>{card}</Box>
                    ))}
                </Masonry>
            </ResponsiveMasonry>
            <ConfirmArchiveModal show={show} setShow={setShow} onConfirm={handleConfirmArchive} />
        </InfiniteScroll>
    );
}
