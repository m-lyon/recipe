import { useEffect } from 'react';

import { TagList } from '@recipe/features/tags';
import { useUser } from '@recipe/features/user';
import { useRecipeStore } from '@recipe/stores';
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
    const { perServing, uncountedIds, loading } = useNutritionalInfo(
        recipe.ingredientSubsections,
        currentServings
    );
    // Compute allUncounted here so NutritionalInfoPanel doesn't need the full subsections array.
    // Guard with !loading so we don't evaluate before data is available — if loading is true,
    // the panel renders skeletons regardless of allUncounted.
    const totalIngredients = recipe.ingredientSubsections
        .flatMap((s) => s.ingredients)
        .filter((i) => i.ingredient.__typename === 'Ingredient').length;
    const allUncounted = !loading && uncountedIds.size > 0 && totalIngredients === uncountedIds.size;
    useEffect(() => {
        setNumServings(recipe.numServings);
    }, [recipe.numServings, setNumServings]);

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
                    />
                    <NutritionalInfoPanel
                        perServing={perServing}
                        uncountedIds={uncountedIds}
                        allUncounted={allUncounted}
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
