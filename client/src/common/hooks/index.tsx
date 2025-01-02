export { useWakeLock } from './useWakeLock';
export { useDropdown } from './useDropdown';
import { createToastHook } from './toastCreator';

export const useInfoToast = createToastHook('info');
export const useErrorToast = createToastHook('error');
export const useSuccessToast = createToastHook('success');
export const useWarningToast = createToastHook('warning');
