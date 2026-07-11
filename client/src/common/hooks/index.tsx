export { useWakeLock } from './useWakeLock';
export { useDropdown } from './useDropdown';
export { useStandalone } from './useStandalone';
import { createToastHook } from './toastCreator';
export { useMinimumLoading } from './useMinimumLoading';
export { useBackNavigation } from './useBackNavigation';
export { usePullToRefresh, PULL_THRESHOLD } from './usePullToRefresh';

export const useInfoToast = createToastHook('info');
export const useErrorToast = createToastHook('error');
export const useSuccessToast = createToastHook('success');
export const useWarningToast = createToastHook('warning');
