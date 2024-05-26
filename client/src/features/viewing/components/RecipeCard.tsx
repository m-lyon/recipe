import { useState } from 'react';
import { Link } from 'react-router-dom';
import { CloseIcon, EditIcon } from '@chakra-ui/icons';
import { IconButton, LinkOverlay, useBreakpointValue } from '@chakra-ui/react';
import { Card, CardBody, CardHeader, Heading, LinkBox } from '@chakra-ui/react';

import { ROOT_PATH } from '@recipe/constants';
import { TagList } from '@recipe/features/tags';
import { Recipe } from '@recipe/graphql/generated';

export function getCardTitle(recipe: Recipe): string {
    const title = recipe.isIngredient
        ? recipe.numServings > 1
            ? recipe.pluralTitle
            : recipe.title
        : recipe.title;
    return title as string;
}

interface Props {
    recipe: Recipe;
    hasEditPermission: boolean;
    handleDelete: (id: string) => void;
}
export function RecipeCard(props: Props) {
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
        <LinkBox>
            <Card
                minH='10em'
                width='18em'
                onMouseEnter={() => setIsHovered(true)}
                onMouseLeave={() => setIsHovered(false)}
            >
                <LinkOverlay as={Link} to={`${ROOT_PATH}/view/recipe/${recipe.titleIdentifier}`} />
                {hasEditPermission ? (
                    <IconButton
                        variant='solid'
                        colorScheme='gray'
                        aria-label='Edit recipe'
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
                        {getCardTitle(recipe)}
                    </Heading>
                </CardHeader>
                <CardBody>
                    <TagList tags={recipe.tags} />
                </CardBody>
                {hasEditPermission ? (
                    <IconButton
                        variant='solid'
                        colorScheme='gray'
                        aria-label='Delete recipe'
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
