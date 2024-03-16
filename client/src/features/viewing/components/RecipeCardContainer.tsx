import { Recipe } from '../../../__generated__/graphql';
import { Wrap, WrapItem } from '@chakra-ui/react';
import { RecipeCard } from './RecipeCard';
import { ImageRecipeCard } from './ImageRecipeCard';
import { groupIntoPairs } from '../../../utils/array';

interface Props {
    recipes: Recipe[];
}
export function RecipeCardContainer(props: Props) {
    const { recipes } = props;

    const recipeWithImages = recipes.filter((recipe) => recipe.images && recipe.images.length > 0);
    const recipeWithoutImages = recipes.filter(
        (recipe) => !recipe.images || recipe.images.length === 0
    );
    const { pairs, remainder } = groupIntoPairs(recipeWithoutImages);

    const imageCards = recipeWithImages.map((recipe) => <ImageRecipeCard recipe={recipe} />);
    const recipeCardPairs = pairs.map((pair) => {
        return (
            <Wrap spacing='30px' direction='column'>
                <WrapItem>
                    <RecipeCard recipe={pair[0]} />
                </WrapItem>
                <WrapItem>
                    <RecipeCard recipe={pair[1]} />
                </WrapItem>
            </Wrap>
        );
    });
    const recipeCardRemainder = remainder ? [<RecipeCard recipe={remainder} />] : [];
    const recipeCards = [...imageCards, ...recipeCardPairs, ...recipeCardRemainder];

    return (
        <Wrap spacing='30px'>
            {recipeCards.map((card, index) => (
                <WrapItem key={index}>{card}</WrapItem>
            ))}
        </Wrap>
    );
}
