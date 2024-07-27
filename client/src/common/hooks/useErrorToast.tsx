import { useToast } from '@chakra-ui/react';
import { ToastPosition } from '@chakra-ui/react';

import { DELAY_LONG } from '@recipe/constants';

interface UseErrorToastOptions {
    title: string;
    description?: string;
    position?: ToastPosition;
}
export function useErrorToast() {
    const toast = useToast();
    return (opts: UseErrorToastOptions) => {
        toast({
            status: 'error',
            duration: DELAY_LONG,
            isClosable: true,
            ...opts,
        });
    };
}
