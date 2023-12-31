import { Text } from '@chakra-ui/react';
import { Recipe } from '../../../__generated__/graphql';

interface Props {
    source: Recipe['source'];
}
export function Source(props: Props) {
    const { source } = props;
    if (!source) {
        return null;
    }
    return (
        <Text textAlign='right' fontWeight={'medium'} as='i'>
            Source: {source}
        </Text>
    );
}
