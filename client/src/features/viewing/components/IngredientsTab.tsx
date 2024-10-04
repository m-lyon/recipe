import { useEffect, useState } from 'react';

import { TagList } from '@recipe/features/tags';
import { useUser } from '@recipe/features/user';
import { Servings } from '@recipe/features/servings';
import { IngredientsTabLayout } from '@recipe/layouts';
import { StarRating, useViewStarRating } from '@recipe/features/rating';

import { Notes } from './Notes';
import { IngredientList } from './IngredientList';

interface Props {
    recipeId: string;
    ingredients: CompletedRecipeView['ingredientSubsections'];
    notes: CompletedRecipeView['notes'];
    numServings: CompletedRecipeView['numServings'];
    tags: CompletedRecipeView['tags'];
    calculatedTags: CompletedRecipeView['calculatedTags'];
}
export function IngredientsTab(props: Props) {
    const { recipeId, ingredients, notes, numServings, tags, calculatedTags } = props;
    const [servings, setServings] = useState(numServings);
    const { isLoggedIn } = useUser();
    const { avgRating, getRatings, setRating } = useViewStarRating();

    useEffect(() => {
        getRatings(recipeId);
        // do not include getRatings in the dependency array
        // because it will cause an infinite loop
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [recipeId]);

    return (
        <IngredientsTabLayout
            Servings={<Servings num={servings} setNum={setServings} />}
            StarRating={
                <StarRating rating={avgRating} setRating={setRating} readonly={!isLoggedIn} />
            }
            IngredientList={
                <IngredientList
                    subsections={ingredients}
                    origServings={numServings}
                    currentServings={servings}
                    weightAndVolumeBtns
                />
            }
            Notes={<Notes notes={notes} />}
            Tags={
                <TagList
                    tags={tags.map((tag) => tag.value).concat(calculatedTags)}
                    pb='24px'
                    display={{ base: 'block', md: 'none' }}
                />
            }
        />
    );
}
