import { useState } from 'react';
import { Link } from 'react-router-dom';
import { CloseIcon, EditIcon } from '@chakra-ui/icons';
import { Box, Flex, LinkBox, LinkOverlay, VStack } from '@chakra-ui/react';
import { Card, CardBody, CardHeader, Heading, IconButton, Spacer } from '@chakra-ui/react';

import { ROOT_PATH } from '@recipe/constants';
import { RecipeFromMany } from '@recipe/types';
import { TagList } from '@recipe/features/tags';
import { Tag } from '@recipe/graphql/generated';
import { ImageViewerHome } from '@recipe/features/images';

import { getCardTitle } from './RecipeCard';

interface Props {
    recipe: RecipeFromMany;
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
                <Flex minWidth='max-content' direction='row'>
                    <Box zIndex={1} display={hasEditPermission ? undefined : 'none'}>
                        <Box position='absolute'>
                            <IconButton
                                variant='solid'
                                colorScheme='gray'
                                aria-label={`Edit ${recipe.title}`}
                                icon={<EditIcon />}
                                isRound={true}
                                shadow='base'
                                opacity={{ base: 1, md: isHovered ? 1 : 0 }}
                                transform={{
                                    base: 'translate(-50%, -50%)',
                                    md: `translate(-50%, -50%) scale(${isHovered ? 1 : 0})`,
                                }}
                                transition='opacity 0.3s, transform 0.3s'
                                as={Link}
                                to={`${ROOT_PATH}/edit/recipe/${recipe.titleIdentifier}`}
                            />
                        </Box>
                    </Box>
                    <Spacer />
                    <Box zIndex={1} display={hasEditPermission ? undefined : 'none'}>
                        <Box position='absolute'>
                            <IconButton
                                variant='solid'
                                colorScheme='gray'
                                aria-label={`Delete ${recipe.title}`}
                                icon={<CloseIcon />}
                                isRound={true}
                                shadow='base'
                                opacity={{ base: 1, md: isHovered ? 1 : 0 }}
                                transform={{
                                    base: 'translate(-50%, -50%)',
                                    md: `translate(-50%, -50%) scale(${isHovered ? 1 : 0})`,
                                }}
                                transition='opacity 0.3s, transform 0.3s'
                                onClick={() => handleDelete(recipe._id)}
                            />
                        </Box>
                    </Box>
                </Flex>
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
            </Card>
        </LinkBox>
    );
}
