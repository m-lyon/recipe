import { useEffect } from 'react';
import { TbMeat } from 'react-icons/tb';
import { Link } from 'react-router-dom';
import { PiPlant } from 'react-icons/pi';
import { IconButton, Tooltip } from '@chakra-ui/react';

import { PATH } from '@recipe/constants';
import { useUser } from '@recipe/features/user';
import { useRecipeStore } from '@recipe/stores';
import { TagList } from '@recipe/features/tags';
import { IngredientsTabLayout } from '@recipe/layouts';
import { useAddRating } from '@recipe/features/rating';
import { StarRating, getAverageRating } from '@recipe/features/rating';
import { Servings, UnitSystemToggle, useDisplayedIngredient } from '@recipe/features/servings';

import { Notes } from './Notes';
import { Yield } from './Yield';
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
    const { isVerified, isAdmin, user } = useUser();
    const { addRatingWithToast } = useAddRating();
    const nutrition = useNutritionalInfo(recipe);
    const { perServing, uncountedIds, uncounted, partial, owners, loading, error } = nutrition;
    const displayLine = useDisplayedIngredient(currentServings, recipe.numServings);
    useEffect(() => {
        setNumServings(recipe.numServings);
    }, [recipe.numServings, setNumServings]);

    const dietToggle = recipe.originalRecipe ? (
        <Tooltip label='View original recipe' openDelay={500}>
            <IconButton
                as={Link}
                to={`${PATH.BASE}/view/recipe/${recipe.originalRecipe.titleIdentifier}`}
                aria-label='View original recipe'
                icon={<TbMeat />}
                mr='2'
            />
        </Tooltip>
    ) : recipe.veganVersion ? (
        <Tooltip label='View vegan version' openDelay={500}>
            <IconButton
                as={Link}
                to={`${PATH.BASE}/view/recipe/${recipe.veganVersion.titleIdentifier}`}
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
            Yield={
                recipe.yield?.length ? (
                    <Yield
                        rows={recipe.yield}
                        title={recipe.title}
                        pluralTitle={recipe.pluralTitle}
                        currentServings={currentServings}
                        origServings={recipe.numServings}
                    />
                ) : undefined
            }
            IngredientList={
                <>
                    <IngredientList
                        subsections={recipe.ingredientSubsections}
                        origServings={recipe.numServings}
                        currentServings={currentServings}
                        showWakeLockBtn
                        uncountedIngredientIds={loading ? undefined : uncountedIds}
                        dietToggle={dietToggle}
                        unitToggle={<UnitSystemToggle mr='2' />}
                    />
                    <NutritionalInfoPanel
                        perServing={perServing}
                        uncountedIds={uncountedIds}
                        uncounted={uncounted}
                        partial={partial}
                        canEditIngredient={(id) =>
                            isVerified && (isAdmin || (!!user && owners.get(id) === user._id))
                        }
                        canEditRecipes={isVerified}
                        displayLine={displayLine}
                        nothingCounted={nutrition.nothingCounted}
                        loading={loading}
                        error={error}
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
