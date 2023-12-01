import { GetIngredientOptsQuery } from '../../../../../__generated__/graphql';
import { MutableRefObject } from 'react';
import { NewIngredientForm } from './NewIngredientForm';
import { DropdownList } from './DropdownList';
import { matchSorter } from 'match-sorter';
import { Ingredient } from '../../../../../__generated__/graphql';

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
export function IngredientNameDropdownList(props: Props) {
    const filter = (data: GetIngredientOptsQuery, value: string): Suggestion[] => {
        const items = matchSorter<Ingredient>(data.ingredientMany, value, {
            keys: ['name'],
        }).map((item) => {
            return {
                value: item.name,
                colour: undefined,
                _id: item._id,
            };
        }) as Suggestion[];
        if (items.length === 0) {
            items.push({ value: 'add new ingredient', colour: 'gray.400', _id: undefined });
        }
        return items;
    };

    return <DropdownList filter={filter} AddNewForm={NewIngredientForm} {...props} />;
}
