import { Card, CardBody, CardHeader } from '@chakra-ui/react';
import { Heading, Text, Button } from '@chakra-ui/react';
import { CardFooter } from '@chakra-ui/react';
import { Tag } from '../../../__generated__/graphql';

interface Props {
    title: string;
    recipeId: string;
    tags: Tag[];
}
export function RecipeCard(props: Props) {
    const { title, recipeId } = props;

    const tagsStr = props.tags.map((tag) => tag.value).join(', ');
    return (
        <Card>
            <CardHeader>
                <Heading size='md'>{title}</Heading>
            </CardHeader>
            <CardBody>
                <Text>{tagsStr}</Text>
            </CardBody>
            <CardFooter>
                <Button as={'a'} href={`/recipe/view/${recipeId}`}>
                    View here
                </Button>
            </CardFooter>
        </Card>
    );
}
