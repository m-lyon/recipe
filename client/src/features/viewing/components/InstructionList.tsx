import { Box, List, Text } from '@chakra-ui/react';

interface Props {
    instructions: InstructionSubsectionView[];
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
                <List.Item fontWeight={fontWeight} fontSize={fontSize} key={index}>
                    <Text>{instr}</Text>
                </List.Item>
            );
        });
        if (index === 0) {
            return (
                <Box key={section.name ?? 'main-instructions'}>
                    <Text fontSize='2xl' pb='10px'>
                        {section.name ? section.name : 'Instructions'}
                    </Text>
                    <List.Root as='ol' gap='2'>
                        {instructionsList}
                    </List.Root>
                </Box>
            );
        } else {
            return (
                <Box key={section.name}>
                    <Text fontSize='2xl' pb='10px' pt='22px'>
                        {section.name}
                    </Text>

                    <List.Root as='ol' gap='2'>
                        {instructionsList}
                    </List.Root>
                </Box>
            );
        }
    });

    return <Box mb='16px'>{subsectionsList}</Box>;
}
