import { useState } from 'react';
import { Link } from 'react-router-dom';
import { LinkBox, LinkOverlay, VStack } from '@chakra-ui/react';
import { Card, CardBody, CardHeader, Heading } from '@chakra-ui/react';

import { PATH } from '@recipe/constants';
import { TagList } from '@recipe/features/tags';
import { StarRating } from '@recipe/features/rating';
import { ImageViewerHome } from '@recipe/features/images';
import { getAverageRating } from '@recipe/features/rating';

import { getCardTitle } from './RecipeCard';
import { ModifyButtons } from './ModifyButtons';

interface Props {
    recipe: RecipePreview;
    hasEditPermission: boolean;
    handleDelete: (id: string) => void;
}
export function ImageRecipeCard(props: Props) {
    const { recipe, hasEditPermission, handleDelete } = props;
    const [isHovered, setIsHovered] = useState(false);

    return (
        <LinkBox display='flex' flexDirection='column'>
            <Card
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
                <CardHeader>
                    <LinkOverlay
                        as={Link}
                        to={`${PATH.ROOT}/view/recipe/${recipe.titleIdentifier}`}
                    >
                        <Heading size='md' color='blackAlpha.700'>
                            {getCardTitle(recipe)}
                        </Heading>
                    </LinkOverlay>
                </CardHeader>
                <CardBody p='0'>
                    <LinkOverlay
                        as={Link}
                        to={`${PATH.ROOT}/view/recipe/${recipe.titleIdentifier}`}
                        aria-label={`View ${recipe.title}`}
                    >
                        <VStack gap={2} align='left'>
                            <StarRating
                                rating={getAverageRating(recipe.ratings)}
                                addRating={() => {}}
                                readonly
                                size={15}
                                colour='rgb(160, 174, 192)'
                                px='20px'
                                aria-label={`Rating for ${recipe.title}`}
                            />
                            <TagList
                                tags={recipe.tags
                                    .map((tag) => tag.value)
                                    .concat(recipe.calculatedTags)}
                                px='20px'
                            />
                            <ImageViewerHome
                                images={recipe.images.filter((image) => image !== null) || []}
                            />
                        </VStack>
                    </LinkOverlay>
                </CardBody>
            </Card>
        </LinkBox>
    );
}
