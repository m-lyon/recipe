import { Dispatch, SetStateAction } from 'react';
import { useOutletContext } from 'react-router-dom';

export type SetSearchQuery = Dispatch<SetStateAction<string>>;
export interface UseSearchQuery {
    searchQuery: string;
    setSearchQuery: SetSearchQuery;
}

export function useSearchQuery() {
    const { searchQuery, setSearchQuery } = useOutletContext<UseSearchQuery>();
    return { searchQuery, setSearchQuery };
}
