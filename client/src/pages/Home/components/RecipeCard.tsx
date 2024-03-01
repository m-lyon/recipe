import { Card, CardBody, CardHeader, Heading } from '@chakra-ui/react';
import { TagList } from '../../ViewRecipe/components/TagList';
import { GetRecipesQuery } from '../../../__generated__/graphql';
import { Link } from 'react-router-dom';

export function getCardTitle(recipe: GetRecipesQuery['recipeMany'][0]): string {
    const title = recipe.isIngredient
        ? recipe.numServings > 1
            ? recipe.pluralTitle
            : recipe.title
        : recipe.title;
    return title as string;
}

interface Props {
    recipe: GetRecipesQuery['recipeMany'][0];
}
export function RecipeCard(props: Props) {
    const { recipe } = props;

    return (
        <Card
            as={Link}
            to={`/recipe/view/${recipe.titleIdentifier}`}
            height='10em'
            width='18em'
            position='static'
        >
            <CardHeader>
                <Heading size='md' color='blackAlpha.700'>
                    {getCardTitle(recipe)}
                </Heading>
            </CardHeader>
            <CardBody>
                <TagList tags={recipe.tags} />
            </CardBody>
        </Card>
    );
}
