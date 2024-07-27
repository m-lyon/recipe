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
    return (opts: UseSuccessToastOptions) => {
        toast({
            ...opts,
            status: 'success',
            duration: DELAY_SHORT,
            isClosable: true,
        });
    };
}
