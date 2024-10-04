import { useMeasure } from 'react-use';
import { Box, Flex, Spacer, VStack } from '@chakra-ui/react';

import { TagList } from '@recipe/features/tags';
import { tagsHeight } from '@recipe/features/tags';
import { ImageViewerRecipe } from '@recipe/features/images';
import { imageCardWidth, sliderBarHeight } from '@recipe/features/images';

import { Source } from './Source';
import { InstructionList } from './InstructionList';

export const instrSpacing = 24;
interface Props {
    tags: TagsView;
    instructions: InstructionSubsectionView[];
    source: SourceView;
    images: ImageView[];
    calculatedTags: CalculatedTagsView;
}
export function InstructionsTab(props: Props) {
    const { tags, instructions, source, images, calculatedTags } = props;
    const [ref, { height }] = useMeasure();

    const boxHeight = (height ? height : 0) - tagsHeight - instrSpacing;

    return (
        <Flex direction='column' justifyContent='space-between' height='100%'>
            <Flex direction='row'>
                <Box position='relative' w='100%'>
                    <ImageViewerRecipe
                        images={images}
                        cardRef={ref}
                        display={{ base: 'none', md: 'block' }}
                    />
                    <VStack spacing={{ base: undefined, md: `${instrSpacing}px` }} align='left'>
                        <TagList
                            tags={tags.map((tag) => tag.value).concat(calculatedTags)}
                            displayBoxMargin={true}
                            display={{ base: 'none', md: 'block' }}
                        />
                        <Box pr='24px'>
                            <Box
                                h={images.length > 1 ? boxHeight + sliderBarHeight : boxHeight}
                                w={imageCardWidth - 24}
                                marginLeft='4'
                                marginBottom='4'
                                float='right'
                                position='relative'
                                display={{
                                    base: 'none',
                                    md: images.length !== 0 ? 'block' : 'none',
                                }}
                            />
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
