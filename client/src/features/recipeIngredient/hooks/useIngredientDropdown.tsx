import { useMutation } from '@apollo/client';
import { KeyboardEvent, RefObject } from 'react';

import { useDropdown, useErrorToast } from '@recipe/common/hooks';
import { CreatePrepMethodMutation } from '@recipe/graphql/generated';
import { CREATE_PREP_METHOD } from '@recipe/graphql/mutations/prepMethod';

import { Suggestion } from '../utils/suggestions';

export function useIngredientDropdown(
    strValue: string,
    suggestions: Suggestion[],
    setItem: (attr: SetAttr) => void,
    openPopover: (type: PopoverType) => void,
    deleteChar: () => void,
    listRef: RefObject<HTMLUListElement>
) {
    const toast = useErrorToast();
    const { active, handleSetActive, handleKeyboardEvent, resetView } = useDropdown(
        suggestions,
        listRef
    );
    const [saveBespokePrepMethod] = useMutation(CREATE_PREP_METHOD, {
        onCompleted: (data: CreatePrepMethodMutation) => {
            setItem(data.prepMethodCreateOne!.record!);
            resetView();
        },
        onError: (error) => {
            toast({
                title: 'Error saving unit',
                description: error.message,
                position: 'top',
            });
        },
    });

    const handleSelect = (item: Suggestion | undefined) => {
        if (!item) {
            setItem(undefined);
            resetView();
            return;
        }
        if (typeof item.value === 'string') {
            switch (item.value) {
                case 'add new unit':
                    openPopover('unit');
                    break;
                case 'add new size':
                    openPopover('size');
                    break;
                case 'add new ingredient':
                    openPopover('ingredient');
                    break;
                case 'add new prep method':
                    openPopover('prepMethod');
                    break;
                case 'skip prep method':
                case 'skip unit':
                case 'skip size':
                case 'skip quantity':
                    setItem(null);
                    resetView();
                    break;
                default:
                    if (/^use ".*" as unit$/.test(item.value)) {
                        openPopover('bespokeUnit');
                    } else if (/^use ".*" as prep method$/.test(item.value)) {
                        saveBespokePrepMethod({
                            variables: { record: { value: strValue, unique: false } },
                        });
                    }
                    break;
            }
        } else {
            setItem(item.value);
            resetView();
        }
    };

    const onKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
        if (['Backspace'].includes(e.key)) {
            e.preventDefault();
        }
        if (e.key === 'Backspace') {
            deleteChar();
        }
        handleKeyboardEvent(e, handleSelect);
    };

    return { active, handleSetActive, onKeyDown, handleSelect };
}
