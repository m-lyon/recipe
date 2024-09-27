import { useEffect, useState } from 'react';

import { TagList } from '@recipe/features/tags';
import { useUser } from '@recipe/features/user';
import { Servings } from '@recipe/features/servings';
import { IngredientSubsection } from '@recipe/types';
import { IngredientsTabLayout } from '@recipe/layouts';
import { Recipe, Tag } from '@recipe/graphql/generated';
import { StarRating, useViewStarRating } from '@recipe/features/rating';

import { Notes } from './Notes';
import { IngredientList } from './IngredientList';

interface Props {
    recipeId: string;
    ingredients: IngredientSubsection[];
    notes: Recipe['notes'];
    numServings: Recipe['numServings'];
    tags: Recipe['tags'];
    calculatedTags: Recipe['calculatedTags'];
}
export function IngredientsTab(props: Props) {
    const { recipeId, ingredients, notes, numServings, tags, calculatedTags } = props;
    const [servings, setServings] = useState(numServings);
    const { isLoggedIn } = useUser();
    const { avgRating, getRatings, setRating } = useViewStarRating();

    useEffect(() => {
        getRatings(recipeId);
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
                    tags={tags.concat(calculatedTags.map((tag) => ({ value: tag }) as Tag))}
                    pb='24px'
                    display={{ base: 'block', md: 'none' }}
                />
            }
        />
    );
}
