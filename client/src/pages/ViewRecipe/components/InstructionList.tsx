import { OrderedList, ListItem, Text } from '@chakra-ui/react';
import { Recipe } from '../../../__generated__/graphql';

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
            <ListItem fontWeight={'medium'} key={index}>
                <Text fontSize='lg'>{instr}</Text>
            </ListItem>
        );
    });

    return <OrderedList spacing={'2'}>{instructionsList}</OrderedList>;
}
