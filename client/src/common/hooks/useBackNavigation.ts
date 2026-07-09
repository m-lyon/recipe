import { useNavigate } from 'react-router-dom';

import { PATH } from '@recipe/constants';

// Hybrid back navigation for standalone PWA mode (no browser back button).
// Pops in-app history when it exists, otherwise falls back to home. This handles
// the cold deep-link case (e.g. a shared recipe link opened fresh) where there is
// no history to pop and `navigate(-1)` would be a dead button.
export function useBackNavigation() {
    const navigate = useNavigate();
    return () => {
        const idx = (window.history.state?.idx as number | undefined) ?? 0;
        if (idx > 0) {
            navigate(-1);
        } else {
            navigate(PATH.ROOT);
        }
    };
}
