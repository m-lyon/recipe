import { CgBowl } from 'react-icons/cg';
import { TbWeight } from 'react-icons/tb';
import { useEffect, useState } from 'react';
import { HStack, IconButton } from '@chakra-ui/react';

import { changeIngredientQuantity } from 'utils/quantity';

import { Notes } from './Notes';
import { TagList } from './TagList';
import { IngredientList } from './IngredientList';
import { Servings } from '../../../components/Servings';
import { StarRating } from '../../../components/StarRating';
import { useViewStarRating } from '../../../hooks/useViewStarRating';
import { Recipe, RecipeIngredient } from '../../../__generated__/graphql';
import { IngredientsTabLayout } from '../../../layouts/IngredientsTabLayout';

interface Props {
    recipeId: string;
    ingredients: RecipeIngredient[];
    notes: Recipe['notes'];
    numServings: Recipe['numServings'];
    tags: Recipe['tags'];
}
export function IngredientsTab(props: Props) {
    const { recipeId, ingredients, notes, numServings, tags } = props;
    const [servings, setServings] = useState(numServings);
    const { avgRating, getRatings, setRating } = useViewStarRating();

    useEffect(() => {
        getRatings(recipeId);
    }, [recipeId]);

    const modifiedIngredients = ingredients.map((ingredient) => {
        return changeIngredientQuantity(ingredient, servings, numServings);
    });

    return (
        <IngredientsTabLayout
            Servings={<Servings num={servings} setNum={setServings} />}
            StarRating={<StarRating rating={avgRating} setRating={setRating} />}
            UnitOptions={
                <HStack spacing={2}>
                    <IconButton aria-label='weight' icon={<TbWeight />} />
                    <IconButton aria-label='volume' icon={<CgBowl />} />
                </HStack>
            }
            IngredientList={<IngredientList ingredients={modifiedIngredients} />}
            Notes={<Notes notes={notes} />}
            Tags={<TagList tags={tags} pb='24px' />}
        />
    );
}
