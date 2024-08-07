import { CgBowl } from 'react-icons/cg';
import { TbWeight } from 'react-icons/tb';
import { HStack, IconButton } from '@chakra-ui/react';
import { useContext, useEffect, useState } from 'react';

import { TagList } from '@recipe/features/tags';
import { UserContext } from '@recipe/features/user';
import { IngredientsTabLayout } from '@recipe/layouts';
import { changeQuantity } from '@recipe/utils/quantity';
import { Servings, useUnitConversion } from '@recipe/features/servings';
import { StarRating, useViewStarRating } from '@recipe/features/rating';
import { Recipe, RecipeIngredient, Tag } from '@recipe/graphql/generated';

import { IngredientList } from './IngredientList';
import { Notes } from './Notes';

interface Props {
    recipeId: string;
    ingredients: RecipeIngredient[];
    notes: Recipe['notes'];
    numServings: Recipe['numServings'];
    tags: Recipe['tags'];
    calculatedTags: Recipe['calculatedTags'];
}
export function IngredientsTab(props: Props) {
    const { recipeId, ingredients, notes, numServings, tags, calculatedTags } = props;
    const [userContext] = useContext(UserContext);
    const [servings, setServings] = useState(numServings);
    const { avgRating, getRatings, setRating } = useViewStarRating();
    const { apply } = useUnitConversion();

    useEffect(() => {
        getRatings(recipeId);
    }, [recipeId]);

    const modifiedIngredients = ingredients.map((ingredient) => {
        return changeQuantity(ingredient, servings, numServings, apply);
    });

    return (
        <IngredientsTabLayout
            Servings={<Servings num={servings} setNum={setServings} />}
            StarRating={
                <StarRating rating={avgRating} setRating={setRating} readonly={!userContext} />
            }
            UnitOptions={
                <HStack spacing={2}>
                    <IconButton aria-label='weight' icon={<TbWeight />} />
                    <IconButton aria-label='volume' icon={<CgBowl />} />
                </HStack>
            }
            IngredientList={<IngredientList ingredients={modifiedIngredients} />}
            Notes={<Notes notes={notes} />}
            Tags={
                <TagList
                    tags={tags.concat(calculatedTags.map((tag) => ({ value: tag }) as Tag))}
                    pb='24px'
                />
            }
        />
    );
}
