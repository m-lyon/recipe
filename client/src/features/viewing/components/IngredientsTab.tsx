import { useEffect } from 'react';
import { TbMeat } from 'react-icons/tb';
import { Link } from 'react-router-dom';
import { PiPlant } from 'react-icons/pi';
import { IconButton, Tooltip } from '@chakra-ui/react';

import { PATH } from '@recipe/constants';
import { useUser } from '@recipe/features/user';
import { useRecipeStore } from '@recipe/stores';
import { TagList } from '@recipe/features/tags';
import { Servings } from '@recipe/features/servings';
import { IngredientsTabLayout } from '@recipe/layouts';
import { useAddRating } from '@recipe/features/rating';
import { StarRating, getAverageRating } from '@recipe/features/rating';

import { Notes } from './Notes';
import { UsedIn } from './UsedIn';
import { IngredientList } from './IngredientList';

interface Props {
    recipe: CompletedRecipeView;
}
export function IngredientsTab(props: Props) {
    const { recipe } = props;
    const setNumServings = useRecipeStore((state) => state.setNumServings);
    const currentServings = useRecipeStore((state) => state.numServings);
    const { isVerified } = useUser();
    const { addRatingWithToast } = useAddRating();
    useEffect(() => {
        setNumServings(recipe.numServings);
    }, [recipe.numServings, setNumServings]);

    const dietToggle = recipe.originalRecipe ? (
        <Tooltip label='View original recipe' openDelay={500}>
            <IconButton
                as={Link}
                to={`${PATH.ROOT}/view/recipe/${recipe.originalRecipe.titleIdentifier}`}
                aria-label='View original recipe'
                icon={<TbMeat />}
                mr='2'
            />
        </Tooltip>
    ) : recipe.veganVersion ? (
        <Tooltip label='View vegan version' openDelay={500}>
            <IconButton
                as={Link}
                to={`${PATH.ROOT}/view/recipe/${recipe.veganVersion.titleIdentifier}`}
                aria-label='View vegan version'
                icon={<PiPlant />}
                mr='2'
            />
        </Tooltip>
    ) : undefined;

    return (
        <IngredientsTabLayout
            Servings={<Servings />}
            StarRating={
                <StarRating
                    rating={getAverageRating(recipe.ratings)}
                    addRating={(rating: number) => addRatingWithToast(rating, recipe)}
                    readonly={!isVerified}
                    colour='rgba(0, 0, 0, 0.64)'
                />
            }
            IngredientList={
                <IngredientList
                    subsections={recipe.ingredientSubsections}
                    origServings={recipe.numServings}
                    currentServings={currentServings}
                    dietToggle={dietToggle}
                    showWakeLockBtn
                />
            }
            Notes={<Notes notes={recipe.notes} />}
            Tags={
                <TagList
                    tags={recipe.tags.map((tag) => tag.value).concat(recipe.calculatedTags)}
                    pb='24px'
                    display={{ base: 'block', md: 'none' }}
                />
            }
            UsedIn={recipe.isIngredient ? <UsedIn recipeId={recipe._id} /> : undefined}
        />
    );
}
