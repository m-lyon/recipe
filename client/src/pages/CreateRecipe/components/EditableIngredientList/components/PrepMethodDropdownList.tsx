import { GetIngredientOptsQuery } from '../../../../../__generated__/graphql';
import { MutableRefObject } from 'react';
import { DropdownList } from './DropdownList';
import { matchSorter } from 'match-sorter';
import { PrepMethod } from '../../../../../__generated__/graphql';
import { NewPrepMethodForm } from './NewPrepMethodForm';

// TODO: Suggestion interface may be duplicated elsewhere, fix that
export interface Suggestion {
    value: string;
    colour?: string;
    _id: undefined;
}
interface Props {
    strValue: string;
    data: GetIngredientOptsQuery;
    setItem: (value: string | null, _id?: string) => void;
    setIsSelecting: (value: boolean) => void;
    handleSubmit: () => void;
    inputRef: MutableRefObject<HTMLInputElement | null>;
    previewRef: MutableRefObject<HTMLDivElement | null>;
}
export function PrepMethodDropdownList(props: Props) {
    const filter = (data: GetIngredientOptsQuery, value: string): Suggestion[] => {
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

    return <DropdownList filter={filter} AddNewForm={NewPrepMethodForm} {...props} />;
}
