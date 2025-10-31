import { toaster } from '@recipe/components/ui/toaster';
import { DELAY_LONG, DELAY_SHORT } from '@recipe/constants';

type ToastType = 'error' | 'success' | 'warning' | 'info';
interface UseToastOptions {
    title: string;
    description?: string;
    position?: 'top' | 'top-start' | 'top-end' | 'bottom' | 'bottom-start' | 'bottom-end';
}
export function createToastHook(toastType: ToastType) {
    return () => {
        const delayMap = {
            error: DELAY_LONG,
            success: DELAY_SHORT,
            warning: DELAY_LONG,
            info: DELAY_SHORT,
        };
        return (opts: UseToastOptions) => {
            toaster.create({
                type: toastType,
                duration: delayMap[toastType],
                closable: true,
                ...opts,
            });
        };
    };
}
