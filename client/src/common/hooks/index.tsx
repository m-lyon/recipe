export { useWakeLock } from './useWakeLock';
export { useDropdown } from './useDropdown';
// import { createToastHook } from './toastCreator';

// export const useInfoToast = createToastHook('info');
// @ts-expect-error temporary
export const useInfoToast = () => (t: any) => {}; // eslint-disable-line
// export const useErrorToast = createToastHook('error');
// @ts-expect-error temporary
export const useErrorToast = () => (t: any) => {}; // eslint-disable-line
// export const useSuccessToast = createToastHook('success');
// @ts-expect-error temporary
export const useSuccessToast = () => (t: any) => {}; // eslint-disable-line
// export const useWarningToast = createToastHook('warning');
// @ts-expect-error temporary
export const useWarningToast = () => (t: any) => {}; // eslint-disable-line
