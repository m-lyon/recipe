import { useOutletContext } from 'react-router-dom';

interface UseSearchQuery {
    delayedSearchQuery: string;
}
export function useDelayedSearchQuery() {
    const { delayedSearchQuery } = useOutletContext<UseSearchQuery>();
    return { searchQuery: delayedSearchQuery };
}
