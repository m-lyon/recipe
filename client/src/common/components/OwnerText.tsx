import { Text } from '@chakra-ui/react';

/** The owner of a document. The API leaves out the name for users other than the owner. */
export interface Owner {
    firstName?: string | null;
    lastName?: string | null;
}

interface Props {
    /** Nothing shows when the name is not known. */
    owner?: Owner | null;
}
/** Shows who owns the item being edited. Inside a button row, it sits on the left. */
export function OwnerText({ owner }: Props) {
    if (!owner?.firstName) {
        return null;
    }
    return (
        <Text mr='auto' alignSelf='flex-end' fontSize='sm' fontWeight='normal' color='gray.500'>
            Owner: {owner.firstName} {owner.lastName}
        </Text>
    );
}
