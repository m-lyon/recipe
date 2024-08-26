import { Box, ListItem, OrderedList, Text } from '@chakra-ui/react';

import { Recipe } from '@recipe/graphql/generated';

interface Props {
    instructions: Recipe['instructionSubsections'];
    fontWeight?: string;
    fontSize?: string;
}
export function InstructionList(props: Props) {
    const { instructions, fontWeight = 'medium', fontSize = 'lg' } = props;

    const subsectionsList = instructions.map((section, index) => {
        if (section === null) {
            return null;
        }
        const instructionsList = section.instructions.map((instr, index) => {
            if (instr === null) {
                return null;
            }
            return (
                <ListItem fontWeight={fontWeight} fontSize={fontSize} key={index}>
                    <Text>{instr}</Text>
                </ListItem>
            );
        });
        if (index === 0) {
            return (
                <Box key={section.name ?? 'main-instructions'}>
                    {section.name ? (
                        <Text fontSize='2xl' pb='10px'>
                            {section.name}
                        </Text>
                    ) : undefined}
                    <OrderedList spacing='2'>{instructionsList}</OrderedList>
                </Box>
            );
        } else {
            return (
                <Box key={section.name}>
                    <Text fontSize='2xl' pb='10px' pt='22px'>
                        {section.name}
                    </Text>

                    <OrderedList spacing='2'>{instructionsList}</OrderedList>
                </Box>
            );
        }
    });

    return <Box>{subsectionsList}</Box>;
}
