import { Tag as UITag, TagLabel, WrapItem, VStack, Wrap, Box } from '@chakra-ui/react';
import { Tag } from '../../../__generated__/graphql';
import { imageCardWidth } from './ImageViewer';

export const tagsHeight = 34;

interface Props {
    tags: Tag[];
}
export function TagList(props: Props) {
    const { tags } = props;

    const tagsList = tags.map((tag) => {
        return (
            <WrapItem key={tag.value}>
                <UITag size='lg'>
                    <TagLabel>{tag.value}</TagLabel>
                </UITag>
            </WrapItem>
        );
    });

    return (
        <Box>
            <Box
                w={imageCardWidth}
                h={tagsHeight}
                float='right'
                position='relative'
                marginLeft='4'
            />
            <VStack align='left' spacing={tagsList.length > 0 ? 3 : 0}>
                <Wrap spacing='10px'>{tagsList}</Wrap>
            </VStack>
        </Box>
    );
}
