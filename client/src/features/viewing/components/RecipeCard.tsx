import { useState } from 'react';
import { Link } from 'react-router-dom';
import { LinkOverlay, VStack } from '@chakra-ui/react';
import { Card, CardBody, CardHeader, Heading, LinkBox } from '@chakra-ui/react';

import { PATH } from '@recipe/constants';
import { TagList } from '@recipe/features/tags';
import { StarRating } from '@recipe/features/rating';
import { getAverageRating } from '@recipe/features/rating';

import { ModifyButtons } from './ModifyButtons';

export function getCardTitle(recipe: RecipePreview): string {
    if (recipe.isIngredient && !recipe.pluralTitle) {
        throw new Error('No plural title for ingredient');
    }
    if (recipe.isIngredient) {
        // pluralTitle is not undefined because of the check above
        return recipe.numServings > 1 ? recipe.pluralTitle! : recipe.title;
    }
    return recipe.title;
}

interface Props {
    recipe: RecipePreview;
    hasEditPermission: boolean;
    handleDelete: (id: string) => void;
}
export function RecipeCard(props: Props) {
    const { recipe, hasEditPermission, handleDelete } = props;
    const [isHovered, setIsHovered] = useState(false);

    return (
        <LinkBox display='flex' flexDirection='column'>
            <Card
                minH='10em'
                width='18rem'
                onMouseEnter={() => setIsHovered(true)}
                onMouseLeave={() => setIsHovered(false)}
            >
                <LinkOverlay
                    as={Link}
                    to={`${PATH.ROOT}/view/recipe/${recipe.titleIdentifier}`}
                    aria-label={`View ${recipe.title}`}
                />
                <ModifyButtons
                    recipe={recipe}
                    isHovering={isHovered}
                    hasEditPermission={hasEditPermission}
                    handleDelete={handleDelete}
                />
                <CardHeader>
                    <Heading size='md' color='blackAlpha.700'>
                        {getCardTitle(recipe)}
                    </Heading>
                </CardHeader>
                <CardBody pt={0}>
                    <VStack align='left' spacing={2}>
                        <StarRating
                            rating={getAverageRating(recipe.ratings)}
                            addRating={() => {}}
                            readonly
                            size={15}
                            colour='rgb(160, 174, 192)'
                        />
                        <TagList
                            tags={recipe.tags.map((tag) => tag.value).concat(recipe.calculatedTags)}
                        />
                    </VStack>
                </CardBody>
            </Card>
        </LinkBox>
    );
}
