import { useState } from 'react';
import { Link } from 'react-router-dom';
import { CloseIcon, EditIcon } from '@chakra-ui/icons';
import { LinkBox, LinkOverlay, VStack, useBreakpointValue } from '@chakra-ui/react';
import { Card, CardBody, CardHeader, Heading, IconButton, Spacer } from '@chakra-ui/react';

import { ROOT_PATH } from '@recipe/constants';
import { TagList } from '@recipe/features/tags';
import { Recipe, Tag } from '@recipe/graphql/generated';
import { ImageViewerHome } from '@recipe/features/images';

import { getCardTitle } from './RecipeCard';

interface Props {
    recipe: Recipe;
    hasEditPermission: boolean;
    handleDelete: (id: string) => void;
}
export function ImageRecipeCard(props: Props) {
    const { recipe, hasEditPermission, handleDelete } = props;
    const [isHovered, setIsHovered] = useState(false);

    const styles = useBreakpointValue(
        {
            base: {
                transform: 'translate(-50%, -50%)',
                opacity: 1,
            },
            md: {
                transform: `translate(-50%, -50%) scale(${isHovered ? 1 : 0})`,
                opacity: isHovered ? 1 : 0,
            },
        },
        { fallback: 'md' }
    );

    return (
        <LinkBox display='flex' flexDirection='column' alignItems='center'>
            <Card
                width='18rem'
                onMouseEnter={() => setIsHovered(true)}
                onMouseLeave={() => setIsHovered(false)}
            >
                {hasEditPermission ? (
                    <IconButton
                        variant='solid'
                        colorScheme='gray'
                        aria-label={`Edit ${recipe.title}`}
                        icon={<EditIcon />}
                        isRound={true}
                        position='absolute'
                        shadow='base'
                        top='0'
                        left='0'
                        zIndex='1'
                        opacity={styles!.opacity}
                        transform={styles!.transform}
                        transition='opacity 0.3s, transform 0.3s'
                        width='1'
                        as={Link}
                        to={`${ROOT_PATH}/edit/recipe/${recipe.titleIdentifier}`}
                    />
                ) : null}
                <CardHeader>
                    <Heading size='md' color='blackAlpha.700'>
                        <LinkOverlay
                            as={Link}
                            to={`${ROOT_PATH}/view/recipe/${recipe.titleIdentifier}`}
                        >
                            {getCardTitle(recipe)}
                        </LinkOverlay>
                    </Heading>
                </CardHeader>
                <CardBody p='0'>
                    <LinkOverlay
                        as={Link}
                        to={`${ROOT_PATH}/view/recipe/${recipe.titleIdentifier}`}
                        aria-label={`View ${recipe.title}`}
                    >
                        <VStack
                            height='100%'
                            justifyContent='space-between'
                            spacing='20px'
                            alignItems='flex-start'
                        >
                            <TagList
                                tags={recipe.tags.concat(
                                    recipe.calculatedTags.map((tag) => ({ value: tag }) as Tag)
                                )}
                                paddingX='20px'
                            />
                            <Spacer />
                            <ImageViewerHome images={recipe.images} />
                        </VStack>
                    </LinkOverlay>
                </CardBody>
                {hasEditPermission ? (
                    <IconButton
                        variant='solid'
                        colorScheme='gray'
                        aria-label={`Delete ${recipe.title}`}
                        icon={<CloseIcon />}
                        isRound={true}
                        position='absolute'
                        shadow='base'
                        top='0'
                        right='-10'
                        zIndex='1'
                        opacity={styles!.opacity}
                        transform={styles!.transform}
                        transition='opacity 0.3s, transform 0.3s'
                        onClick={() => handleDelete(recipe._id)}
                    />
                ) : null}
            </Card>
        </LinkBox>
    );
}
