import { useRef } from 'react';
import { RefObject } from 'react';
import { Button, Dialog, Portal } from '@chakra-ui/react';

interface Props {
    title: string;
    dialogText: string;
    open: boolean;
    onConfirm: () => void;
    onCancel: () => void;
    finalFocusRef?: RefObject<HTMLInputElement>;
    returnFocus?: boolean;
}
export function ConfirmDeleteAlert(props: Props) {
    const { title, dialogText, open, onConfirm, onCancel, finalFocusRef, returnFocus } = props;
    const cancelRef = useRef<HTMLButtonElement>(null);

    return (
        <Dialog.Root
            open={open}
            initialFocusEl={() => cancelRef.current}
            onOpenChange={onCancel}
            finalFocusEl={() => (returnFocus && finalFocusRef ? finalFocusRef.current : null)}
            role='alertdialog'
        >
            <Portal>
                <Dialog.Backdrop />
                <Dialog.Positioner>
                    <Dialog.Content>
                        <Dialog.Header fontSize='lg' fontWeight='bold'>
                            {title}
                        </Dialog.Header>
                        <Dialog.Body>{dialogText}</Dialog.Body>
                        <Dialog.Footer>
                            <Button
                                ref={cancelRef}
                                onClick={onCancel}
                                aria-label={`Cancel ${title.toLowerCase()} action`}
                            >
                                Cancel
                            </Button>
                            <Button
                                colorPalette='red'
                                onClick={onConfirm}
                                ml={3}
                                aria-label={`Confirm ${title.toLowerCase()}`}
                            >
                                Delete
                            </Button>
                        </Dialog.Footer>
                    </Dialog.Content>
                </Dialog.Positioner>
            </Portal>
        </Dialog.Root>
    );
}
