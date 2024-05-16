import { Text } from '@chakra-ui/react';

import { Recipe } from '@recipe/graphql/generated';

interface Props {
    source: Recipe['source'];
}
export function Source(props: Props) {
    const { source } = props;
    if (!source) {
        return null;
    }
    return (
        <Text textAlign='right' fontWeight='medium' as='i' pr={6}>
            Source: {source}
        </Text>
    );
}
