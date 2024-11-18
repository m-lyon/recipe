import { RefObject, useRef } from 'react';
import { AlertDialog, AlertDialogBody, AlertDialogContent } from '@chakra-ui/react';
import { AlertDialogFooter, AlertDialogHeader, AlertDialogOverlay, Button } from '@chakra-ui/react';

interface Props {
    title: string;
    dialogText: string;
    isOpen: boolean;
    onConfirm: () => void;
    onCancel: () => void;
    finalFocusRef?: RefObject<HTMLInputElement>;
    returnFocus?: boolean;
}
export function ConfirmDeleteAlert(props: Props) {
    const { title, dialogText, isOpen, onConfirm, onCancel, finalFocusRef, returnFocus } = props;
    const cancelRef = useRef<HTMLButtonElement>(null);

    return (
        <AlertDialog
            isOpen={isOpen}
            leastDestructiveRef={cancelRef}
            onClose={onCancel}
            finalFocusRef={returnFocus ? finalFocusRef : undefined}
        >
            <AlertDialogOverlay>
                <AlertDialogContent>
                    <AlertDialogHeader fontSize='lg' fontWeight='bold'>
                        {title}
                    </AlertDialogHeader>
                    <AlertDialogBody>{dialogText}</AlertDialogBody>
                    <AlertDialogFooter>
                        <Button
                            ref={cancelRef}
                            onClick={onCancel}
                            aria-label={`Cancel ${title.toLowerCase()} action`}
                        >
                            Cancel
                        </Button>
                        <Button
                            colorScheme='red'
                            onClick={onConfirm}
                            ml={3}
                            aria-label={`Confirm ${title.toLowerCase()}`}
                        >
                            Delete
                        </Button>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialogOverlay>
        </AlertDialog>
    );
}
