import { Flex, Spacer, VStack, Box } from '@chakra-ui/react';
import { InstructionList } from './InstructionList';
import { Source } from './Source';
import { Recipe } from '../../../__generated__/graphql';
import { TagList } from './TagList';
import { ImageViewer } from './ImageViewer';

interface Props {
    tags: Recipe['tags'];
    instructions: Recipe['instructions'];
    source: Recipe['source'];
}
export function InstructionsTab(props: Props) {
    const { tags, instructions, source } = props;

    const images = ['https://bit.ly/naruto-sage', 'https://bit.ly/dan-abramov', 'https://bit.ly/naruto-sage'];
    // const images = ['https://bit.ly/naruto-sage']
    return (
        <Flex direction='column' justifyContent='space-between' height='100%'>
            <Flex direction='row'>
                <Box position='relative'>
                    <ImageViewer images={images}/>
                    <VStack spacing='24px' align='left' border='1px black solid'>
                        <TagList tags={tags} />
                        <InstructionList instructions={instructions} />
                    </VStack>
                </Box>
            </Flex>
            <Spacer />
            <Source source={source} />
        </Flex>
    );
}
