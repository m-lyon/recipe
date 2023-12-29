import { Card, CardBody, CardHeader, WrapItem } from '@chakra-ui/react';
import { Heading } from '@chakra-ui/react';
import { TagList } from '../../ViewRecipe/components/TagList';
import { Tag } from '../../../__generated__/graphql';

interface Props {
    title: string;
    recipeId: string;
    tags: Tag[];
}
export function RecipeCard(props: Props) {
    const { title, recipeId, tags } = props;

    return (
        <WrapItem>
            <Card as='a' href={`/recipe/view/${recipeId}`} height='15em' width='18em'>
                <CardHeader>
                    <Heading size='md' color='blackAlpha.700'>
                        {title}
                    </Heading>
                </CardHeader>
                <CardBody>
                    <TagList tags={tags} />
                </CardBody>
            </Card>
        </WrapItem>
    );
}
