import { GetPrepMethodsQuery } from '../../../../../__generated__/graphql';
import { MutableRefObject } from 'react';
import { DropdownList } from './DropdownList';
import { matchSorter } from 'match-sorter';
import { PrepMethod } from '../../../../../__generated__/graphql';
import { NewPrepMethodPopover } from './NewPrepMethodPopover';
import { Suggestion } from '../../../types';

interface Props {
    strValue: string;
    data: GetPrepMethodsQuery;
    setItem: (value: string | null, _id?: string) => void;
    setIsSelecting: (value: boolean) => void;
    handleSubmit: () => void;
    inputRef: MutableRefObject<HTMLInputElement | null>;
    previewRef: MutableRefObject<HTMLDivElement | null>;
}
export function PrepMethodDropdownList(props: Props) {
    const filter = (data: GetPrepMethodsQuery, value: string): Suggestion[] => {
        const items = matchSorter<PrepMethod>(data.prepMethodMany, value, {
            keys: ['value'],
        }) as Suggestion[];
        if (value === '') {
            items.unshift({ value: 'skip prep method', colour: 'gray.400', _id: undefined });
        }
        if (items.length === 0) {
            items.push({ value: 'add new prep method', colour: 'gray.400', _id: undefined });
        }
        return items;
    };

    return <DropdownList filter={filter} AddNewPopover={NewPrepMethodPopover} {...props} />;
}
