import { Text } from '@chakra-ui/react';

interface Props {
    title: string;
}
export function Title(props: Props) {
    const { title } = props;
    return (
        <Text fontSize='3xl' textAlign='center'>
            {title}
        </Text>
    );
}
