import { Flex, Spacer, VStack, Box } from '@chakra-ui/react';
import { InstructionList } from './InstructionList';
import { Source } from './Source';
import { Recipe } from '../../../__generated__/graphql';
import { TagList } from './TagList';
import { ImageViewer } from './ImageViewer';

export const instrSpacing = 24;
interface Props {
    tags: Recipe['tags'];
    instructions: Recipe['instructions'];
    source: Recipe['source'];
    images: Recipe['images'];
}
export function InstructionsTab(props: Props) {
    const { tags, instructions, source, images } = props;

    return (
        <Flex direction='column' justifyContent='space-between' height='100%'>
            <Flex direction='row'>
                <Box position='relative' w='100%'>
                    {images ? images.length > 0 && <ImageViewer images={images} /> : undefined}
                    <VStack spacing={`${instrSpacing}px`} align='left'>
                        <TagList tags={tags} />
                        <InstructionList
                            instructions={instructions}
                            numImages={images ? images.length : 0}
                        />
                    </VStack>
                </Box>
            </Flex>
            <Spacer />
            <Source source={source} />
        </Flex>
    );
}
