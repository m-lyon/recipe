import { Text, VStack } from '@chakra-ui/react';

interface Props {
    title: string;
}
export function Title(props: Props) {
    const { title } = props;
    return (
        <VStack gap={3} align='left'>
            <Text fontSize='3xl' textAlign='center' aria-label='recipe-title'>
                {title}
            </Text>
        </VStack>
    );
}
