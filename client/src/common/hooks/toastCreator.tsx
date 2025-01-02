import { useState } from 'react';
import { useToast } from '@chakra-ui/react';
import { ToastPosition } from '@chakra-ui/react';

import { DELAY_LONG, DELAY_SHORT } from '@recipe/constants';

type ToastType = 'error' | 'success' | 'warning' | 'info';
interface UseToastOptions {
    title: string;
    description?: string;
    position?: ToastPosition;
}
export function createToastHook(toastType: ToastType) {
    return () => {
        const toast = useToast();
        const [id] = useState(`${toastType}-${Math.random().toString()}`);
        const delayMap = {
            error: DELAY_LONG,
            success: DELAY_SHORT,
            warning: DELAY_LONG,
            info: DELAY_SHORT,
        };
        return (opts: UseToastOptions) => {
            if (!toast.isActive(id)) {
                toast({
                    id,
                    status: toastType,
                    duration: delayMap[toastType],
                    isClosable: true,
                    ...opts,
                });
            }
        };
    };
}
