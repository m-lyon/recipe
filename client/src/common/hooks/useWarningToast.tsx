import { useState } from 'react';
import { useToast } from '@chakra-ui/react';
import { ToastPosition } from '@chakra-ui/react';

import { DELAY_LONG } from '@recipe/constants';

interface UseWarningToastOptions {
    title: string;
    description?: string;
    position?: ToastPosition;
}
export function useWarningToast() {
    const toast = useToast();
    const [id] = useState(`warning-${Math.random().toString()}`);
    return (opts: UseWarningToastOptions) => {
        if (!toast.isActive(id)) {
            toast({ id, status: 'warning', duration: DELAY_LONG, isClosable: true, ...opts });
        }
    };
}
