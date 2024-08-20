import { useMeasure } from 'react-use';
import { Box, Flex, Spacer, VStack, useBreakpointValue } from '@chakra-ui/react';

import { TagList } from '@recipe/features/tags';
import { tagsHeight } from '@recipe/features/tags';
import { Recipe, Tag } from '@recipe/graphql/generated';
import { ImageViewerRecipe } from '@recipe/features/images';
import { imageCardWidth, sliderBarHeight } from '@recipe/features/images';

import { Source } from './Source';
import { InstructionList } from './InstructionList';

export const instrSpacing = 24;
interface Props {
    tags: Recipe['tags'];
    instructions: Recipe['instructions'];
    source: Recipe['source'];
    images: Recipe['images'];
    calculatedTags: Recipe['calculatedTags'];
}
export function InstructionsTab(props: Props) {
    const { tags, instructions, source, images, calculatedTags } = props;
    const [ref, { height }] = useMeasure();

    const styles = useBreakpointValue(
        {
            base: { showImages: false },
            md: { showImages: true },
        },
        { fallback: 'md' }
    );

    const boxHeight = (height ? height : 0) - tagsHeight - instrSpacing;
    const numImages = images ? images.length : 0;

    return (
        <Flex direction='column' justifyContent='space-between' height='100%'>
            <Flex direction='row'>
                <Box position='relative' w='100%'>
                    {styles?.showImages && <ImageViewerRecipe images={images} cardRef={ref} />}
                    <VStack
                        spacing={styles?.showImages ? `${instrSpacing}px` : undefined}
                        align='left'
                    >
                        {styles?.showImages && (
                            <TagList
                                tags={tags.concat(
                                    calculatedTags.map((tag) => ({ value: tag }) as Tag)
                                )}
                                displayBoxMargin={true}
                            />
                        )}
                        <Box pr='24px'>
                            {styles?.showImages && numImages ? (
                                <Box
                                    h={numImages > 1 ? boxHeight + sliderBarHeight : boxHeight}
                                    w={imageCardWidth - 24}
                                    marginLeft='4'
                                    marginBottom='4'
                                    float='right'
                                    position='relative'
                                />
                            ) : undefined}
                            <InstructionList instructions={instructions} />
                        </Box>
                    </VStack>
                </Box>
            </Flex>
            <Spacer />
            <Source source={source} />
        </Flex>
    );
}
