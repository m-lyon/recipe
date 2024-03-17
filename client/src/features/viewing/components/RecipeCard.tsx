import { Card, CardBody, CardHeader, Heading, LinkBox } from '@chakra-ui/react';
import { IconButton, LinkOverlay } from '@chakra-ui/react';
import { CloseIcon, EditIcon } from '@chakra-ui/icons';
import { TagList } from './TagList';
import { Recipe } from '../../../__generated__/graphql';
import { Link } from 'react-router-dom';
import { ROOT_PATH } from '../../../constants';
import { useState } from 'react';

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
    handleDelete: (id: string) => void;
}
export function RecipeCard(props: Props) {
    const { recipe, handleDelete } = props;
    const [isHovered, setIsHovered] = useState(false);

    return (
        <>
            <LinkBox>
                <Card
                    minH='10em'
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
                    <CardBody>
                        <TagList tags={recipe.tags} />
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
        </>
    );
}
