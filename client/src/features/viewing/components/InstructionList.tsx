import { Box, ListItem, OrderedList, Text, useBreakpointValue } from '@chakra-ui/react';

import { Recipe } from '@recipe/graphql/generated';

import { tagsHeight } from '../../tags/components/TagList';
import { instrSpacing } from './InstructionsTab';
import { imageCardWidth, sliderBarHeight } from './ImageViewerRecipe';

interface Props {
    instructions: Recipe['instructions'];
    numImages: number;
    imageHeight: number | null | undefined;
}
export function InstructionList(props: Props) {
    const { instructions, numImages, imageHeight } = props;
    const boxHeight = (imageHeight ? imageHeight : 0) - tagsHeight - instrSpacing;
    const styles = useBreakpointValue(
        {
            base: { showImage: false },
            md: { showImage: true },
        },
        { fallback: 'md' }
    );
    const instructionsList = instructions.map((instr, index) => {
        if (instr === null) {
            return null;
        }
        return (
            <ListItem fontWeight='medium' key={index}>
                <Text fontSize='lg'>{instr}</Text>
            </ListItem>
        );
    });

    return (
        <Box pr='24px'>
            {styles?.showImage && numImages ? (
                <Box
                    h={numImages > 1 ? boxHeight + sliderBarHeight : boxHeight}
                    w={imageCardWidth - 24}
                    marginLeft='4'
                    marginBottom='4'
                    float='right'
                    position='relative'
                />
            ) : undefined}
            <OrderedList spacing='2'>{instructionsList}</OrderedList>
        </Box>
    );
}
