import { useNavigate } from 'react-router-dom';

import { PATH } from '@recipe/constants';

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
