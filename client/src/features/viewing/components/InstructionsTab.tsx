import { useMeasure } from 'react-use';
import { Box, Flex, Spacer, VStack } from '@chakra-ui/react';

import { TagList } from '@recipe/features/tags';
import { tagsHeight } from '@recipe/features/tags';
import { imageCardWidth } from '@recipe/features/images';
import { ImageViewerRecipe } from '@recipe/features/images';

import { Source } from './Source';
import { InstructionList } from './InstructionList';

export const instrSpacing = 24;
interface Props {
    recipe: CompletedRecipeView;
}
export function InstructionsTab(props: Props) {
    const { recipe } = props;
    const [ref, { height }] = useMeasure();
    const actualTagsHeight = recipe.tags.length > 0 ? tagsHeight : 0;
    const boxHeight = (height ? height : 0) - actualTagsHeight - instrSpacing;

    return (
        <Flex direction='column' justifyContent='space-between' height='100%'>
            <Flex direction='row'>
                <Box position='relative' w='100%'>
                    <ImageViewerRecipe
                        images={recipe.images}
                        cardRef={ref}
                        display={{ base: 'none', md: 'block' }}
                    />
                    <VStack spacing={{ base: undefined, md: `${instrSpacing}px` }} align='left'>
                        <TagList
                            tags={recipe.tags.map((tag) => tag.value).concat(recipe.calculatedTags)}
                            displayBoxMargin={recipe.images.length !== 0}
                            display={{ base: 'none', md: 'block' }}
                        />
                        <Box pr='24px'>
                            <Box
                                h={boxHeight}
                                w={imageCardWidth - 24}
                                marginLeft='4'
                                marginBottom='4'
                                float='right'
                                position='relative'
                                display={{
                                    base: 'none',
                                    md: recipe.images.length !== 0 ? 'block' : 'none',
                                }}
                            />
                            <InstructionList instructions={recipe.instructionSubsections} />
                        </Box>
                    </VStack>
                </Box>
            </Flex>
            <Spacer />
            <Source source={recipe.source} />
        </Flex>
    );
}
