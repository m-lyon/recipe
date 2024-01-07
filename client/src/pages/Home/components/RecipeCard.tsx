import { Card, CardBody, CardHeader, WrapItem, Heading } from '@chakra-ui/react';
import { TagList } from '../../ViewRecipe/components/TagList';
import { Tag } from '../../../__generated__/graphql';

interface Props {
    title: string;
    titleIdentifier: string;
    tags: Tag[];
}
export function RecipeCard(props: Props) {
    const { title, titleIdentifier, tags } = props;

    return (
        <WrapItem>
            <Card
                as='a'
                href={`/recipe/view/${titleIdentifier}`}
                height='15em'
                width='18em'
                position='static'
            >
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
