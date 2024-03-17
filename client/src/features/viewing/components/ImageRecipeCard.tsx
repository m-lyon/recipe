import { Card, CardBody, CardHeader, Flex, Heading, LinkBox, LinkOverlay } from '@chakra-ui/react';
import { TagList } from './TagList';
import { Recipe } from '../../../__generated__/graphql';
import { getCardTitle } from './RecipeCard';
import { ImageViewerHome } from './ImageViewerHome';
import { Link } from 'react-router-dom';
import { ROOT_PATH } from '../../../constants';
import { IconButton } from '@chakra-ui/react';
import { EditIcon, CloseIcon } from '@chakra-ui/icons';
import { useState } from 'react';

interface Props {
    recipe: Recipe;
    handleDelete: (id: string) => void;
}
export function ImageRecipeCard(props: Props) {
    const { recipe, handleDelete } = props;
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
            </Card>
        </LinkBox>
    );
}
