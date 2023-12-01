import { GetIngredientOptsQuery } from '../../../../../__generated__/graphql';
import { MutableRefObject } from 'react';
import { NewUnitForm } from './NewUnitForm';
import { DropdownList } from './DropdownList';
import { matchSorter } from 'match-sorter';
import { Unit } from '../../../../../__generated__/graphql';

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
    inputRef: MutableRefObject<HTMLInputElement | null>;
    previewRef: MutableRefObject<HTMLDivElement | null>;
}
export function UnitDropdownList(props: Props) {
    const filter = (data: GetIngredientOptsQuery, value: string): Suggestion[] => {
        const items = matchSorter<Unit>(data.unitMany, value, {
            keys: ['longSingular', 'longPlural'],
        }).map((item) => {
            return { value: item.longSingular, colour: undefined, _id: item._id };
        }) as Suggestion[];
        if (value === '') {
            items.unshift({ value: 'skip unit', colour: 'gray.400', _id: undefined });
        }
        if (items.length === 0) {
            items.push({ value: 'add new unit', colour: 'gray.400', _id: undefined });
        }
        return items;
    };

    return <DropdownList filter={filter} AddNewForm={NewUnitForm} {...props} />;
}
