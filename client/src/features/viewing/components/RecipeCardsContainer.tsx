import { useState } from 'react';
import { Box } from '@chakra-ui/react';
import { useQuery } from '@apollo/client';
import InfiniteScroll from 'react-infinite-scroll-component';
import Masonry, { ResponsiveMasonry } from 'react-responsive-masonry';
import { useSearchStore } from 'stores/useSearchStore';

import { useUser } from '@recipe/features/user';
import { ConfirmDeleteModal } from '@recipe/features/editing';
import { FETCH_MORE_NUM, INIT_LOAD_NUM } from '@recipe/constants';
import { COUNT_RECIPES, GET_RECIPES } from '@recipe/graphql/queries/recipe';

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

export function RecipeCardsContainer() {
    const searchQuery = useSearchStore((state) => state.delayedTitleFilter);
    const { data, loading, error, fetchMore } = useQuery(GET_RECIPES, {
        variables: { offset: 0, limit: INIT_LOAD_NUM },
    });
    const [show, setShow] = useState(false);
    const [recipeId, setRecipeId] = useState('');
    const { user } = useUser();
    const { data: countData } = useQuery(COUNT_RECIPES, {
        variables: {
            filter: searchQuery
                ? { _operators: { title: { regex: `/${searchQuery}/i` } } }
                : undefined,
        },
    });

    const handleDelete = (id: string) => {
        setRecipeId(id);
        setShow(true);
    };

    if (loading) {
        return <div>Loading...</div>;
    }

    if (error || !data) {
        return <div>Error: {error?.message}</div>;
    }

    const recipes = data.recipeMany;

    const recipeCards = recipes.map((recipe) => {
        if (recipe.images && recipe.images.length > 0) {
            return (
                <ImageRecipeCard
                    recipe={recipe}
                    hasEditPermission={hasPermission(user, recipe)}
                    handleDelete={handleDelete}
                />
            );
        }
        return (
            <RecipeCard
                recipe={recipe}
                hasEditPermission={hasPermission(user, recipe)}
                handleDelete={handleDelete}
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
                        filter: searchQuery
                            ? { _operators: { title: { regex: `/${searchQuery}/i` } } }
                            : undefined,
                    },
                });
            }}
            hasMore={countData?.recipeCount ? countData?.recipeCount > recipes.length : false}
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
            <ConfirmDeleteModal show={show} setShow={setShow} recipeId={recipeId} />
        </InfiniteScroll>
    );
}
