import { useState } from 'react';
import { Box } from '@chakra-ui/react';
import { useQuery } from '@apollo/client';
import InfiniteScroll from 'react-infinite-scroll-component';
import Masonry, { ResponsiveMasonry } from 'react-responsive-masonry';

import { useUser } from '@recipe/features/user';
import { ConfirmDeleteModal } from '@recipe/features/editing';
import { COUNT_RECIPES } from '@recipe/graphql/queries/recipe';

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

interface Props {
    recipes: RecipePreview[];
    fetchMore: () => void;
    searchQuery: string;
}
export function RecipeCardsContainer(props: Props) {
    const { recipes, fetchMore, searchQuery } = props;
    const [show, setShow] = useState(false);
    const [recipeId, setRecipeId] = useState('');
    const { user } = useUser();
    const { data } = useQuery(COUNT_RECIPES, {
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
            next={fetchMore}
            hasMore={data?.recipeCount ? data?.recipeCount > recipes.length : false}
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
