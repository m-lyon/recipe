import { useMeasure } from '@uidotdev/usehooks';
import { Box, Flex, Spacer, VStack, useBreakpointValue } from '@chakra-ui/react';

import { Source } from './Source';
import { TagList } from './TagList';
import { InstructionList } from './InstructionList';
import { ImageViewerRecipe } from './ImageViewerRecipe';
import { Recipe } from '../../../__generated__/graphql';

export const instrSpacing = 24;
interface Props {
    tags: Recipe['tags'];
    instructions: Recipe['instructions'];
    source: Recipe['source'];
    images: Recipe['images'];
}
export function InstructionsTab(props: Props) {
    const { tags, instructions, source, images } = props;
    const [ref, { height }] = useMeasure();

    const styles = useBreakpointValue(
        {
            base: { showImages: false },
            md: { showImages: true },
        },
        { fallback: 'md' },
    );

    return (
        <Flex direction='column' justifyContent='space-between' height='100%'>
            <Flex direction='row'>
                <Box position='relative' w='100%'>
                    {styles?.showImages && <ImageViewerRecipe images={images} cardRef={ref} />}
                    <VStack
                        spacing={styles?.showImages ? `${instrSpacing}px` : undefined}
                        align='left'
                    >
                        {styles?.showImages && <TagList tags={tags} displayBoxMargin={true} />}
                        <InstructionList
                            instructions={instructions}
                            numImages={images ? images.length : 0}
                            imageHeight={height}
                        />
                    </VStack>
                </Box>
            </Flex>
            <Spacer />
            <Source source={source} />
        </Flex>
    );
}
