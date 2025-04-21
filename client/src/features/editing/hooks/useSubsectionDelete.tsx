import { useState } from 'react';
import { useDisclosure } from '@chakra-ui/react';

export function useSubsectionDelete() {
    const { open, onOpen, onClose } = useDisclosure();
    const [returnFocus, setReturnFocus] = useState<boolean>(true);
    const [indexToDelete, setIndexToDelete] = useState<number>(0);

    const handleOpen = (index: number) => {
        setIndexToDelete(index);
        setReturnFocus(true);
        onOpen();
    };

    const handleConfirm = (confirm: (index: number) => void) => {
        setReturnFocus(false);
        confirm(indexToDelete);
        onClose();
    };

    const handleCancel = () => {
        onClose();
    };

    return {
        open,
        handleOpen,
        handleConfirm,
        handleCancel,
        returnFocus,
        indexToDelete,
    };
}
