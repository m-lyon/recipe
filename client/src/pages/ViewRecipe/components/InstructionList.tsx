import { OrderedList, ListItem, Text } from '@chakra-ui/react';

interface Props {
    instructions: (string | null)[];
}
export function InstructionList(props: Props) {
    const { instructions } = props;

    const instructionsList = instructions.map((instr, index) => {
        if (instr === null) {
            return null;
        }
        return (
            <ListItem key={index}>
                <Text fontSize='lg'>{instr}</Text>
            </ListItem>
        );
    });

    return <OrderedList>{instructionsList}</OrderedList>;
}
