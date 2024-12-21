import { useCallback, useEffect, useState } from 'react';

export function useWakeLock() {
    const [wakeLock, setWakeLock] = useState<WakeLockSentinel | null>(null);
    const [isAwake, setIsAwake] = useState(false);

    const enableWakeLock = useCallback(async () => {
        try {
            if (!isAwake) {
                const lock = await navigator.wakeLock.request('screen');
                setWakeLock(lock);
                setIsAwake(true);

                // Automatically handle wake lock release
                lock.addEventListener('release', () => {
                    setWakeLock(null);
                    setIsAwake(false);
                });
            }
        } catch (err) {
            console.error('Failed to enable wake lock:', err);
        }
    }, [isAwake]);

    const disableWakeLock = useCallback(async () => {
        try {
            if (wakeLock) {
                await wakeLock.release();
                setWakeLock(null);
                setIsAwake(false);
            }
        } catch (err) {
            console.error('Failed to disable wake lock:', err);
        }
    }, [wakeLock]);

    const toggleWakeLock = useCallback(async () => {
        if (isAwake) {
            await disableWakeLock();
        } else {
            await enableWakeLock();
        }
    }, [isAwake, enableWakeLock, disableWakeLock]);

    useEffect(() => {
        return () => {
            if (wakeLock) {
                wakeLock.release().catch((err) => {
                    console.error('Failed to release wake lock during cleanup:', err);
                });
            }
        };
    }, [wakeLock]);

    return { isAwake, enableWakeLock, disableWakeLock, toggleWakeLock };
}
