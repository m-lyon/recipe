import { useEffect } from 'react';

import { TagList } from '@recipe/features/tags';
import { useUser } from '@recipe/features/user';
import { useRecipeStore } from '@recipe/stores';
import { Servings } from '@recipe/features/servings';
import { IngredientsTabLayout } from '@recipe/layouts';
import { StarRating, useViewStarRating } from '@recipe/features/rating';

import { Notes } from './Notes';
import { IngredientList } from './IngredientList';

interface Props {
    recipeId: string;
    ingredients: IngredientSubsectionView[];
    notes: NotesView;
    numServings: ServingNumberView;
    tags: RecipeTagsView;
    calculatedTags: CalculatedTagsView;
}
export function IngredientsTab(props: Props) {
    const { recipeId, ingredients, notes, numServings, tags, calculatedTags } = props;
    const setNumServings = useRecipeStore((state) => state.setNumServings);
    const currentServings = useRecipeStore((state) => state.numServings);
    const { isLoggedIn } = useUser();
    const { avgRating, getRatings, setRating } = useViewStarRating();

    useEffect(() => {
        getRatings(recipeId);
        // do not include getRatings in the dependency array
        // because it will cause an infinite loop
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [recipeId]);

    useEffect(() => {
        setNumServings(numServings);
    }, [numServings, setNumServings]);

    return (
        <IngredientsTabLayout
            Servings={<Servings />}
            StarRating={
                <StarRating rating={avgRating} setRating={setRating} readonly={!isLoggedIn} />
            }
            IngredientList={
                <IngredientList
                    subsections={ingredients}
                    origServings={numServings}
                    currentServings={currentServings}
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
