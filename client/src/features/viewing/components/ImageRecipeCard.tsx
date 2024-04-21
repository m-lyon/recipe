import { useState } from 'react';
import { Link } from 'react-router-dom';
import { CloseIcon, EditIcon } from '@chakra-ui/icons';
import { LinkBox, LinkOverlay, VStack, useBreakpointValue } from '@chakra-ui/react';
import { Card, CardBody, CardHeader, Heading, IconButton, Spacer } from '@chakra-ui/react';

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
                width='18em'
                onMouseEnter={() => setIsHovered(true)}
                onMouseLeave={() => setIsHovered(false)}
            >
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
                        to={`${ROOT_PATH}/edit/${recipe.titleIdentifier}`}
                    />
                ) : null}
                <CardHeader>
                    <Heading size='md' color='blackAlpha.700'>
                        <LinkOverlay as={Link} to={`${ROOT_PATH}/view/${recipe.titleIdentifier}`}>
                            {getCardTitle(recipe)}
                        </LinkOverlay>
                    </Heading>
                </CardHeader>
                <CardBody p='0'>
                    <LinkOverlay as={Link} to={`${ROOT_PATH}/view/${recipe.titleIdentifier}`}>
                        <VStack
                            height='100%'
                            justifyContent='space-between'
                            spacing='20px'
                            alignItems='flex-start'
                        >
                            <TagList tags={recipe.tags} paddingX='20px' />
                            <Spacer />
                            <ImageViewerHome images={recipe.images} />
                        </VStack>
                    </LinkOverlay>
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
