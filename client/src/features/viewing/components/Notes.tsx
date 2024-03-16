import { Text } from '@chakra-ui/react';
import { Recipe } from '../../../__generated__/graphql';

interface Props {
    notes: Recipe['notes'];
}
export function Notes(props: Props) {
    const { notes } = props;
    if (!notes) {
        return null;
    }
    return (
        <>
            <Text fontSize='2xl'>Notes</Text>
            <Text fontSize='md' fontWeight={'medium'}>
                {notes}
            </Text>
        </>
    );
}
