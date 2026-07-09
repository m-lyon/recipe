import { useState } from 'react';

// Returns true when the app is running as an installed / standalone PWA.
// The `navigator.standalone` check is required: it is the only reliable signal
// on iOS, where the `display-mode` media query is unsupported/flaky. Without it
// the standalone-gated features (back button, pull-to-refresh) never show on iPhone.
function getIsStandalone(): boolean {
    if (typeof window === 'undefined') {
        return false;
    }
    const displayModeStandalone =
        window.matchMedia?.('(display-mode: standalone)').matches ?? false;
    const iosStandalone =
        (window.navigator as Navigator & { standalone?: boolean }).standalone === true;
    return displayModeStandalone || iosStandalone;
}

export function useStandalone(): boolean {
    // Display-mode rarely changes at runtime, so a one-time read on mount is sufficient.
    const [isStandalone] = useState(getIsStandalone);
    return isStandalone;
}
