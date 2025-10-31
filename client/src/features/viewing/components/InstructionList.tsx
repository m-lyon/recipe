import { Box, Text } from '@chakra-ui/react';

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
                <li style={{ fontWeight, fontSize, marginBottom: '0.5rem' }} key={index}>
                    <Text>{instr}</Text>
                </li>
            );
        });
        if (index === 0) {
            return (
                <Box key={section.name ?? 'main-instructions'}>
                    <Text fontSize='2xl' pb='10px'>
                        {section.name ? section.name : 'Instructions'}
                    </Text>
                    <ol
                        style={{
                            paddingLeft: '1rem',
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '0.5rem',
                        }}
                    >
                        {instructionsList}
                    </ol>
                </Box>
            );
        } else {
            return (
                <Box key={section.name}>
                    <Text fontSize='2xl' pb='10px' pt='22px'>
                        {section.name}
                    </Text>

                    <ol
                        style={{
                            paddingLeft: '1rem',
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '0.5rem',
                        }}
                    >
                        {instructionsList}
                    </ol>
                </Box>
            );
        }
    });

    return <Box mb='16px'>{subsectionsList}</Box>;
}
