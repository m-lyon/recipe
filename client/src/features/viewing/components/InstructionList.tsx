import { ListItem, OrderedList, Text } from '@chakra-ui/react';

import { Recipe } from '@recipe/graphql/generated';

interface Props {
    instructions: Recipe['instructions'];
    fontWeight?: string;
    fontSize?: string;
}
export function InstructionList(props: Props) {
    const { instructions, fontWeight = 'medium', fontSize = 'lg' } = props;
    const instructionsList = instructions.map((instr, index) => {
        if (instr === null) {
            return null;
        }
        return (
            <ListItem fontWeight={fontWeight} fontSize={fontSize} key={index}>
                <Text>{instr}</Text>
            </ListItem>
        );
    });

    return <OrderedList spacing='2'>{instructionsList}</OrderedList>;
}
