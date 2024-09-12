import { useState } from 'react';
import { Link } from 'react-router-dom';
import { CloseIcon, EditIcon } from '@chakra-ui/icons';
import { IconButton, LinkOverlay } from '@chakra-ui/react';
import { Card, CardBody, CardHeader, Heading, LinkBox } from '@chakra-ui/react';

import { ROOT_PATH } from '@recipe/constants';
import { RecipeFromMany } from '@recipe/types';
import { TagList } from '@recipe/features/tags';

export function getCardTitle(recipe: RecipeFromMany): string {
    if (recipe.isIngredient && !recipe.pluralTitle) {
        throw new Error('No plural title for ingredient');
    }
    const title = recipe.isIngredient
        ? recipe.numServings > 1
            ? recipe.pluralTitle!
            : recipe.title
        : recipe.title;
    return title;
}

interface Props {
    recipe: RecipeFromMany;
    hasEditPermission: boolean;
    handleDelete: (id: string) => void;
}
export function RecipeCard(props: Props) {
    const { recipe, hasEditPermission, handleDelete } = props;
    const [isHovered, setIsHovered] = useState(false);

    return (
        <LinkBox display='flex' flexDirection='column' alignItems='center'>
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
                        opacity={{ base: 1, md: isHovered ? 1 : 0 }}
                        transform={{
                            base: 'translate(-50%, -50%)',
                            md: `translate(-50%, -50%) scale(${isHovered ? 1 : 0})`,
                        }}
                        transition='opacity 0.3s, transform 0.3s'
                        width='1'
                        as={Link}
                        to={`${ROOT_PATH}/edit/recipe/${recipe.titleIdentifier}`}
                    />
                ) : null}
                <CardHeader>
                    <Heading size='md' color='blackAlpha.700'>
                        {getCardTitle(recipe)}
                    </Heading>
                </CardHeader>
                <CardBody>
                    <TagList
                        tags={recipe.tags
                            .map((tag) => ({ value: tag.value }))
                            .concat(recipe.calculatedTags.map((tag) => ({ value: tag! })))}
                    />
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
                        opacity={{ base: 1, md: isHovered ? 1 : 0 }}
                        transform={{
                            base: 'translate(-50%, -50%)',
                            md: `translate(-50%, -50%) scale(${isHovered ? 1 : 0})`,
                        }}
                        transition='opacity 0.3s, transform 0.3s'
                        onClick={() => handleDelete(recipe._id)}
                    />
                ) : null}
            </Card>
        </LinkBox>
    );
}
