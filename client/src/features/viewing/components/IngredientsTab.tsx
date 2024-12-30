import { useEffect } from 'react';

import { TagList } from '@recipe/features/tags';
import { useUser } from '@recipe/features/user';
import { useRecipeStore } from '@recipe/stores';
import { Servings } from '@recipe/features/servings';
import { IngredientsTabLayout } from '@recipe/layouts';
import { useAddRating } from '@recipe/features/rating';
import { StarRating, getAverageRating } from '@recipe/features/rating';

import { Notes } from './Notes';
import { IngredientList } from './IngredientList';

interface Props {
    recipe: CompletedRecipeView;
}
export function IngredientsTab(props: Props) {
    const { recipe } = props;
    const setNumServings = useRecipeStore((state) => state.setNumServings);
    const currentServings = useRecipeStore((state) => state.numServings);
    const { isVerified } = useUser();
    const { addRating } = useAddRating(recipe);
    useEffect(() => {
        setNumServings(recipe.numServings);
    }, [recipe.numServings, setNumServings]);

    return (
        <IngredientsTabLayout
            Servings={<Servings />}
            StarRating={
                <StarRating
                    rating={getAverageRating(recipe.ratings)}
                    addRating={addRating}
                    readonly={!isVerified}
                    colour='rgba(0, 0, 0, 0.64)'
                />
            }
            IngredientList={
                <IngredientList
                    subsections={recipe.ingredientSubsections}
                    origServings={recipe.numServings}
                    currentServings={currentServings}
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
        />
    );
}
