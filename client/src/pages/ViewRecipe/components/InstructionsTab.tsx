import { Flex, Spacer, VStack } from '@chakra-ui/react';
import { InstructionList } from './InstructionList';
import { Source } from './Source';
import { Recipe } from '../../../__generated__/graphql';
import { TagList } from './TagList';

interface Props {
    tags: Recipe['tags'];
    instructions: Recipe['instructions'];
    source: Recipe['source'];
}
export function InstructionsTab(props: Props) {
    const { tags, instructions, source } = props;
    return (
        <Flex direction='column' justifyContent='space-between' height='100%'>
            <VStack spacing='24px' align='left'>
                <TagList tags={tags} />
                <InstructionList instructions={instructions} />
            </VStack>
            <Spacer />
            <Source source={source} />
        </Flex>
    );
}
