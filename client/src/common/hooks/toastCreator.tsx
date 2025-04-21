// import { useState } from 'react';
// import { ToastPosition } from '@chakra-ui/react';
import { createToaster } from '@chakra-ui/react';

import { DELAY_LONG, DELAY_SHORT } from '@recipe/constants';

type ToastType = 'error' | 'success' | 'warning' | 'info';
// interface UseToastOptions {
//     title: string;
//     description?: string;
//     position?: ToastPosition;
// }
// export function createToastHook(toastType: ToastType) {
//     return () => {
//         const toast = useToast();
//         const [id] = useState(`${toastType}-${Math.random().toString()}`);
//         const delayMap = {
//             error: DELAY_LONG,
//             success: DELAY_SHORT,
//             warning: DELAY_LONG,
//             info: DELAY_SHORT,
//         };
//         return (opts: UseToastOptions) => {
//             if (!toast.isActive(id)) {
//                 toast({
//                     id,
//                     status: toastType,
//                     duration: delayMap[toastType],
//                     isClosable: true,
//                     ...opts,
//                 });
//             }
//         };
//     };
// }

export function useInfoToast(toastType: ToastType) {
    const toaster = createToaster({
        placement: 'bottom-end',
        pauseOnPageIdle: true,
    });
    const delayMap = {
        error: DELAY_LONG,
        success: DELAY_SHORT,
        warning: DELAY_LONG,
        info: DELAY_SHORT,
    };
    return () => {
        if (toaster.getCount() === 0) {
            toaster.info({
                duration: delayMap[toastType],
                closable: true,
            });
        }
    };
}
