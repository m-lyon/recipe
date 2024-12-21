import { useState } from 'react';
import { Link } from 'react-router-dom';
import { LinkBox, LinkOverlay, VStack } from '@chakra-ui/react';
import { Card, CardBody, CardHeader, Heading, Spacer } from '@chakra-ui/react';

import { PATH } from '@recipe/constants';
import { TagList } from '@recipe/features/tags';
import { ImageViewerHome } from '@recipe/features/images';

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
                    <Heading size='md' color='blackAlpha.700'>
                        <LinkOverlay
                            as={Link}
                            to={`${PATH.ROOT}/view/recipe/${recipe.titleIdentifier}`}
                        >
                            {getCardTitle(recipe)}
                        </LinkOverlay>
                    </Heading>
                </CardHeader>
                <CardBody p='0'>
                    <LinkOverlay
                        as={Link}
                        to={`${PATH.ROOT}/view/recipe/${recipe.titleIdentifier}`}
                        aria-label={`View ${recipe.title}`}
                    >
                        <VStack
                            height='100%'
                            justifyContent='space-between'
                            spacing='20px'
                            alignItems='flex-start'
                        >
                            <TagList
                                tags={recipe.tags
                                    .map((tag) => tag.value)
                                    .concat(recipe.calculatedTags)}
                                paddingX='20px'
                            />
                            <Spacer />
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
