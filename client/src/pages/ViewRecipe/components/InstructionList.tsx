import { OrderedList, ListItem, Text, Box } from '@chakra-ui/react';
import { Recipe } from '../../../__generated__/graphql';
import { imageCardHeight, imageCardWidth, sliderBarHeight } from './ImageViewer';
import { tagsHeight } from './TagList';
import { instrSpacing } from './InstructionsTab';

interface Props {
    instructions: Recipe['instructions'];
    numImages: number;
}
export function InstructionList(props: Props) {
    const { instructions, numImages } = props;
    const boxHeight = imageCardHeight - tagsHeight - instrSpacing;

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
        <Box>
            {numImages ? (
                <Box
                    h={numImages > 1 ? boxHeight + sliderBarHeight : boxHeight}
                    w={imageCardWidth}
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
