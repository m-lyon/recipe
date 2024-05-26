import { useContext, useState } from 'react';
import { Wrap, WrapItem } from '@chakra-ui/react';

import { Recipe } from '@recipe/graphql/generated';
import { groupIntoPairs } from '@recipe/utils/array';
import { ConfirmDeleteModal } from '@recipe/features/editing';
import { IUserContext, UserContext } from '@recipe/features/user';

import { RecipeCard } from './RecipeCard';
import { ImageRecipeCard } from './ImageRecipeCard';

function hasPermission(user: IUserContext, recipe: Recipe) {
    if (!user) {
        return false;
    }
    return user._id === recipe._id || user.role === 'admin';
}

interface Props {
    recipes: Recipe[];
}
export function RecipeCardsContainer(props: Props) {
    const { recipes } = props;
    const [show, setShow] = useState(false);
    const [recipeId, setRecipeId] = useState('');
    const [user] = useContext(UserContext);

    const recipeWithImages = recipes.filter((recipe) => recipe.images && recipe.images.length > 0);
    const recipeWithoutImages = recipes.filter(
        (recipe) => !recipe.images || recipe.images.length === 0
    );
    const { pairs, remainder } = groupIntoPairs(recipeWithoutImages);
    const handleDelete = (id: string) => {
        setRecipeId(id);
        setShow(true);
    };

    const imageCards = recipeWithImages.map((recipe) => {
        return (
            <ImageRecipeCard
                recipe={recipe}
                hasEditPermission={hasPermission(user, recipe)}
                handleDelete={handleDelete}
            />
        );
    });
    const recipeCardPairs = pairs.map((pair) => {
        const [first, second] = pair;
        return (
            <Wrap spacing='30px' direction='column'>
                <WrapItem>
                    <RecipeCard
                        recipe={first}
                        hasEditPermission={hasPermission(user, first)}
                        handleDelete={handleDelete}
                    />
                </WrapItem>
                <WrapItem>
                    <RecipeCard
                        recipe={second}
                        hasEditPermission={hasPermission(user, second)}
                        handleDelete={handleDelete}
                    />
                </WrapItem>
            </Wrap>
        );
    });
    const recipeCardRemainder = remainder
        ? [
              <RecipeCard
                  recipe={remainder}
                  hasEditPermission={hasPermission(user, remainder)}
                  handleDelete={handleDelete}
              />,
          ]
        : [];
    const recipeCards = [...imageCards, ...recipeCardPairs, ...recipeCardRemainder];

    return (
        <>
            <Wrap spacing='30px'>
                {recipeCards.map((card, index) => (
                    <WrapItem key={index}>{card}</WrapItem>
                ))}
            </Wrap>
            <ConfirmDeleteModal show={show} setShow={setShow} recipeId={recipeId} />
        </>
    );
}
