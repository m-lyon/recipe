import { Flex, Spacer } from '@chakra-ui/react';
import { InstructionList } from './InstructionList';
import { Source } from './Source';
import { Recipe } from '../../../__generated__/graphql';

interface Props {
    instructions: Recipe['instructions'];
    source: Recipe['source'];
}
export function InstructionsTab(props: Props) {
    const { instructions, source } = props;
    return (
        <Flex direction={'column'} justifyContent='space-between' height='100%'>
            <InstructionList instructions={instructions} />
            <Spacer />
            <Source source={source} />
        </Flex>
    );
}
