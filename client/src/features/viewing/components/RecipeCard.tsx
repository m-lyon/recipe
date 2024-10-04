import { useState } from 'react';
import { Link } from 'react-router-dom';
import { CloseIcon, EditIcon } from '@chakra-ui/icons';
import { Box, Flex, IconButton, LinkOverlay, Spacer } from '@chakra-ui/react';
import { Card, CardBody, CardHeader, Heading, LinkBox } from '@chakra-ui/react';

import { ROOT_PATH } from '@recipe/constants';
import { TagList } from '@recipe/features/tags';

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
                    to={`${ROOT_PATH}/view/recipe/${recipe.titleIdentifier}`}
                    aria-label={`View ${recipe.title}`}
                />
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
                        {getCardTitle(recipe)}
                    </Heading>
                </CardHeader>
                <CardBody>
                    <TagList
                        tags={recipe.tags.map((tag) => tag.value).concat(recipe.calculatedTags)}
                    />
                </CardBody>
            </Card>
        </LinkBox>
    );
}
