import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Card, Heading, LinkBox, LinkOverlay, VStack } from '@chakra-ui/react';

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
            <Card.Root
                minH='10em'
                width='18rem'
                onMouseEnter={() => setIsHovered(true)}
                onMouseLeave={() => setIsHovered(false)}
            >
                <ModifyButtons
                    recipe={recipe}
                    isHovering={isHovered}
                    hasEditPermission={hasEditPermission}
                    handleDelete={handleDelete}
                />
                <Card.Header>
                    <LinkOverlay asChild>
                        <Link to={`${PATH.ROOT}/view/recipe/${recipe.titleIdentifier}`}>
                            <Heading size='md' color='blackAlpha.700'>
                                {getCardTitle(recipe)}
                            </Heading>
                        </Link>
                    </LinkOverlay>
                </Card.Header>
                <Card.Body pt={0}>
                    <LinkOverlay asChild aria-label={`View ${recipe.title}`}>
                        <Link to={`${PATH.ROOT}/view/recipe/${recipe.titleIdentifier}`}>
                            <VStack align='left' gap={2}>
                                <StarRating
                                    rating={getAverageRating(recipe.ratings)}
                                    addRating={() => {}}
                                    readonly
                                    size={15}
                                    colour='rgb(160, 174, 192)'
                                    aria-label={`Rating for ${recipe.title}`}
                                />
                                <TagList
                                    tags={recipe.tags
                                        .map((tag) => tag.value)
                                        .concat(recipe.calculatedTags)}
                                />
                            </VStack>
                        </Link>
                    </LinkOverlay>
                </Card.Body>
            </Card.Root>
        </LinkBox>
    );
}
