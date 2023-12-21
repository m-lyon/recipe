import { GetIngredientsQuery } from '../../../../../__generated__/graphql';
import { MutableRefObject } from 'react';
import { NewIngredientPopover } from './NewIngredientPopover';
import { DropdownList } from './DropdownList';
import { matchSorter } from 'match-sorter';
import { Ingredient } from '../../../../../__generated__/graphql';
import { Suggestion } from '../../../types';

interface Props {
    strValue: string;
    data: GetIngredientsQuery;
    setItem: (value: string | null, _id?: string) => void;
    inputRef: MutableRefObject<HTMLInputElement | null>;
    previewRef: MutableRefObject<HTMLDivElement | null>;
}
export function IngredientNameDropdownList(props: Props) {
    const filter = (data: GetIngredientsQuery, value: string): Suggestion[] => {
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

    return <DropdownList filter={filter} AddNewPopover={NewIngredientPopover} {...props} />;
}
