import { Text } from '@chakra-ui/react';

interface Props {
    source: SourceView;
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
