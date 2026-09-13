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
import { NutritionalInfoPanel } from './NutritionalInfoPanel';
import { useNutritionalInfo } from '../hooks/useNutritionalInfo';

interface Props {
    recipe: CompletedRecipeView;
}
export function IngredientsTab(props: Props) {
    const { recipe } = props;
    const setNumServings = useRecipeStore((state) => state.setNumServings);
    const currentServings = useRecipeStore((state) => state.numServings);
    const { isVerified } = useUser();
    const { addRatingWithToast } = useAddRating();
    // Call the hook once; pass the results to both IngredientList and NutritionalInfoPanel
    // to avoid calling the hook twice (which would double the GraphQL requests).
    // The subsections passed here are the unscaled quantities, which correspond to
    // recipe.numServings -- not to currentServings, which the servings control moves.
    // Dividing by currentServings would make the per-serving macros change inversely
    // with the slider instead of staying invariant.
    const { perServing, uncountedIds, loading } = useNutritionalInfo(
        recipe.ingredientSubsections,
        recipe.numServings
    );
    // Compute nothingCounted here so NutritionalInfoPanel doesn't need the full subsections
    // array. Guard with !loading so we don't evaluate before data is available — if loading is
    // true, the panel renders skeletons regardless.
    // The empty state is "nothing was counted", not "everything was uncounted": a recipe whose
    // entries are all sub-recipes has no Ingredient-type items at all, so uncountedIds is empty
    // (sumRecipeNutrition skips sub-recipes silently) and the panel would otherwise present a
    // fabricated 0 kcal / 0 g total as a computed result.
    const totalIngredients = recipe.ingredientSubsections
        .flatMap((s) => s.ingredients)
        .filter((i) => i.ingredient.__typename === 'Ingredient').length;
    const nothingCounted =
        !loading && (totalIngredients === 0 || totalIngredients === uncountedIds.size);
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
                <>
                    <IngredientList
                        subsections={recipe.ingredientSubsections}
                        origServings={recipe.numServings}
                        currentServings={currentServings}
                        showWakeLockBtn
                        uncountedIngredientIds={uncountedIds}
                        dietToggle={dietToggle}
                    />
                    <NutritionalInfoPanel
                        perServing={perServing}
                        uncountedIds={uncountedIds}
                        nothingCounted={nothingCounted}
                        loading={loading}
                    />
                </>
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
