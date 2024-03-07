import { Card, CardBody, CardHeader, Flex, Heading, LinkBox, LinkOverlay } from '@chakra-ui/react';
import { TagList } from '../../ViewRecipe/components/TagList';
import { Recipe } from '../../../__generated__/graphql';
import { getCardTitle } from './RecipeCard';
import { ImageViewer } from './ImageViewer';
import { Link } from 'react-router-dom';
import { ROOT_PATH } from '../../../constants';

interface Props {
    recipe: Recipe;
}
export function ImageRecipeCard(props: Props) {
    const { recipe } = props;

    return (
        <LinkBox>
            <Card minHeight='22em' width='18em' position='static'>
                <LinkOverlay as={Link} to={`${ROOT_PATH}/view/${recipe.titleIdentifier}`} />
                <CardHeader>
                    <Heading size='md' color='blackAlpha.700'>
                        {getCardTitle(recipe)}
                    </Heading>
                </CardHeader>
                <CardBody p='0'>
                    <Flex direction='column' justifyContent='space-between' height='100%'>
                        <TagList tags={recipe.tags} paddingX='20px' />
                        <ImageViewer images={recipe.images} />
                    </Flex>
                </CardBody>
            </Card>
        </LinkBox>
    );
}
