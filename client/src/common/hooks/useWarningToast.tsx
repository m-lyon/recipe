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
    return (opts: UseWarningToastOptions) => {
        toast({
            status: 'warning',
            duration: DELAY_LONG,
            isClosable: true,
            ...opts,
        });
    };
}
