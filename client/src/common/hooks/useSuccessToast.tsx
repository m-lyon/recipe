import { useState } from 'react';
import { useToast } from '@chakra-ui/react';
import { ToastPosition } from '@chakra-ui/react';

import { DELAY_SHORT } from '@recipe/constants';

interface UseSuccessToastOptions {
    title: string;
    description?: string;
    position?: ToastPosition;
}
export function useSuccessToast() {
    const toast = useToast();
    const [id] = useState(`success-${Math.random().toString()}`);
    return (opts: UseSuccessToastOptions) => {
        if (!toast.isActive(id)) {
            toast({ id, status: 'success', duration: DELAY_SHORT, isClosable: true, ...opts });
        }
    };
}
