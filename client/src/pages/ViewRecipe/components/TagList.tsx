import { Tag as UITag, TagLabel, WrapItem, VStack, Wrap } from '@chakra-ui/react';
import { Tag } from '../../../__generated__/graphql';

interface Props {
    tags: Tag[];
}
export function TagList(props: Props) {
    const { tags } = props;

    const tagsList = tags.map((tag) => {
        return (
            <WrapItem key={tag.value}>
                <UITag size={'lg'}>
                    <TagLabel>{tag.value}</TagLabel>
                </UITag>
            </WrapItem>
        );
    });

    return (
        <VStack align='left' spacing={tagsList.length > 0 ? 3 : 0}>
            <Wrap spacing='10px'>{tagsList}</Wrap>
        </VStack>
    );
}
