import { Recipe, RecipeIngredient } from '../../../__generated__/graphql';
import { useEffect, useState } from 'react';

import { CgBowl } from 'react-icons/cg';
import { HStack } from '@chakra-ui/react';
import { IconButton } from '@chakra-ui/react';
import { IngredientList } from './IngredientList';
import { IngredientsTabLayout } from '../../../layouts/IngredientsTabLayout';
import { Notes } from './Notes';
import { Servings } from '../../../components/Servings';
import { StarRating } from '../../../components/StarRating';
import { TbWeight } from 'react-icons/tb';
import { useViewStarRating } from '../../../hooks/useViewStarRating';

interface Props {
    recipeId: string;
    ingredients: RecipeIngredient[];
    notes: Recipe['notes'];
    numServings: Recipe['numServings'];
}
export function IngredientsTab(props: Props) {
    const { recipeId, ingredients, notes, numServings } = props;
    const [servings, setServings] = useState(numServings);
    const { avgRating, getRatings, setRating } = useViewStarRating();

    useEffect(() => {
        getRatings(recipeId);
    }, [recipeId]);

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
            IngredientList={<IngredientList ingredients={ingredients} />}
            Notes={<Notes notes={notes} />}
        />
    );
}
