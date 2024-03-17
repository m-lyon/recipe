import { Recipe } from '../../../__generated__/graphql';
import { Wrap, WrapItem } from '@chakra-ui/react';
import { RecipeCard } from './RecipeCard';
import { ImageRecipeCard } from './ImageRecipeCard';
import { groupIntoPairs } from '../../../utils/array';
import { ConfirmDeleteModal } from '../../editing/components/ConfirmDeleteModal';
import { useState } from 'react';

interface Props {
    recipes: Recipe[];
}
export function RecipeCardContainer(props: Props) {
    const { recipes } = props;
    const [show, setShow] = useState(false);
    const [recipeId, setRecipeId] = useState('');

    const recipeWithImages = recipes.filter((recipe) => recipe.images && recipe.images.length > 0);
    const recipeWithoutImages = recipes.filter(
        (recipe) => !recipe.images || recipe.images.length === 0
    );
    const { pairs, remainder } = groupIntoPairs(recipeWithoutImages);
    const handleDelete = (id: string) => {
        setRecipeId(id);
        setShow(true);
    };

    const imageCards = recipeWithImages.map((recipe) => (
        <ImageRecipeCard recipe={recipe} handleDelete={handleDelete} />
    ));
    const recipeCardPairs = pairs.map((pair) => {
        return (
            <Wrap spacing='30px' direction='column'>
                <WrapItem>
                    <RecipeCard recipe={pair[0]} handleDelete={handleDelete} />
                </WrapItem>
                <WrapItem>
                    <RecipeCard recipe={pair[1]} handleDelete={handleDelete} />
                </WrapItem>
            </Wrap>
        );
    });
    const recipeCardRemainder = remainder
        ? [<RecipeCard recipe={remainder} handleDelete={handleDelete} />]
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
