import { Tag, TagLabel, WrapItem, VStack, Wrap, Box, BoxProps } from '@chakra-ui/react';
import { Tag as TagType } from '../../../__generated__/graphql';
import { imageCardWidth } from './ImageViewerRecipe';

export const tagsHeight = 34;

interface Props extends BoxProps {
    tags: TagType[];
    displayBoxMargin?: boolean;
}
export function TagList(props: Props) {
    const { tags, displayBoxMargin, ...rest } = props;

    const tagsList = tags.map((tag) => {
        return (
            <WrapItem key={tag.value}>
                <Tag size='lg'>
                    <TagLabel>{tag.value}</TagLabel>
                </Tag>
            </WrapItem>
        );
    });

    return (
        <Box {...rest}>
            {displayBoxMargin ? (
                <Box
                    w={imageCardWidth}
                    h={tagsHeight}
                    float='right'
                    position='relative'
                    marginLeft='4'
                />
            ) : null}
            <VStack align='left' spacing={tagsList.length > 0 ? 3 : 0}>
                <Wrap spacing='10px'>{tagsList}</Wrap>
            </VStack>
        </Box>
    );
}
