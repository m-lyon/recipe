import { useState } from 'react';
import { Link } from 'react-router-dom';
import { EditIcon, CloseIcon } from '@chakra-ui/icons';
import { IconButton, Heading, Flex } from '@chakra-ui/react';
import { Card, CardBody, CardHeader, LinkBox, LinkOverlay } from '@chakra-ui/react';

import { TagList } from './TagList';
import { getCardTitle } from './RecipeCard';
import { ROOT_PATH } from '../../../constants';
import { ImageViewerHome } from './ImageViewerHome';
import { Recipe } from '../../../__generated__/graphql';

interface Props {
    recipe: Recipe;
    hasEditPermission: boolean;
    handleDelete: (id: string) => void;
}
export function ImageRecipeCard(props: Props) {
    const { recipe, hasEditPermission, handleDelete } = props;
    const [isHovered, setIsHovered] = useState(false);

    return (
        <LinkBox>
            <Card
                height='22em'
                width='18em'
                onMouseEnter={() => setIsHovered(true)}
                onMouseLeave={() => setIsHovered(false)}
            >
                <LinkOverlay as={Link} to={`${ROOT_PATH}/view/${recipe.titleIdentifier}`} />
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
                        opacity={isHovered ? 1 : 0}
                        transform={`translate(-50%, -50%) scale(${isHovered ? 1 : 0})`}
                        transition='opacity 0.3s, transform 0.3s'
                        width='1'
                        as={Link}
                        to={`${ROOT_PATH}/edit/${recipe.titleIdentifier}`}
                    />
                ) : null}
                <CardHeader>
                    <Heading size='md' color='blackAlpha.700'>
                        {getCardTitle(recipe)}
                    </Heading>
                </CardHeader>
                <CardBody p='0'>
                    <Flex direction='column' height='100%' justifyContent='space-between'>
                        <TagList tags={recipe.tags} paddingX='20px' />
                        <ImageViewerHome images={recipe.images} />
                    </Flex>
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
                        opacity={isHovered ? 1 : 0}
                        transform={`translate(-50%, -50%) scale(${isHovered ? 1 : 0})`}
                        transition='opacity 0.3s, transform 0.3s'
                        onClick={() => handleDelete(recipe._id)}
                    />
                ) : null}
            </Card>
        </LinkBox>
    );
}
