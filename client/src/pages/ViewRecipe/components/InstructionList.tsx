import { OrderedList, ListItem, Text, Box } from '@chakra-ui/react';
import { Recipe } from '../../../__generated__/graphql';
import { remainderImageCardHeight, imageCardWidth } from '../../../theme/chakraTheme';

interface Props {
    instructions: Recipe['instructions'];
}
export function InstructionList(props: Props) {
    const { instructions } = props;

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
            <Box
                h={remainderImageCardHeight} // TODO: make this depend on whether image carousel is present or not
                w={imageCardWidth}
                marginLeft='4'
                marginBottom='4'
                float='right'
                position='relative'
                border='1px black solid'
            />
            <OrderedList spacing='2' border='1px black solid'>
                {instructionsList}
            </OrderedList>
        </Box>
    );
}
