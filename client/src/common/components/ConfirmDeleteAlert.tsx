import { RefObject, useRef } from 'react';
import { Button } from '@chakra-ui/react';

import { Dialog } from '@recipe/components/ui/dialog';

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

    const handleOpenChange = (details: { open: boolean }) => {
        if (!details.open) {
            onCancel();
        }
    };

    return (
        <Dialog.Root
            open={open}
            initialFocusEl={returnFocus && finalFocusRef ? () => finalFocusRef.current : undefined}
            onOpenChange={handleOpenChange}
            role='alertdialog'
        >
            <Dialog.Backdrop />
            <Dialog.Positioner>
                <Dialog.Content>
                    <Dialog.Header>
                        <Dialog.Title fontSize='lg' fontWeight='bold'>
                            {title}
                        </Dialog.Title>
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
        </Dialog.Root>
    );
}
