import { useMutation } from '@apollo/client';
import { KeyboardEvent, useEffect, useState } from 'react';

import { useErrorToast } from '@recipe/common/hooks';
import { CreatePrepMethodMutation } from '@recipe/graphql/generated';
import { CREATE_PREP_METHOD } from '@recipe/graphql/mutations/prepMethod';

import { SetAttr } from './useIngredientList';
import { Suggestion } from '../utils/suggestions';
import { PopoverType } from '../components/EditableIngredient';

export function useDropdownList(
    strValue: string,
    suggestions: Suggestion[],
    setItem: (attr: SetAttr) => void,
    openPopover: (type: PopoverType) => void
) {
    const toast = useErrorToast();
    const [highlighted, setHighlighted] = useState(0);
    const [saveBespokePrepMethod] = useMutation(CREATE_PREP_METHOD, {
        onCompleted: (data: CreatePrepMethodMutation) => {
            setItem(data.prepMethodCreateOne!.record!);
        },
        onError: (error) => {
            toast({
                title: 'Error saving unit',
                description: error.message,
                position: 'top',
            });
        },
    });
    useEffect(() => {
        if (highlighted > suggestions.length - 1) {
            setHighlighted(Math.max(suggestions.length - 1, 0));
        }
    }, [highlighted, suggestions.length]);

    const handleSelect = (item: Suggestion) => {
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
                case 'skip prep method':
                    setItem(null);
                    setHighlighted(0);
                    break;
                case 'skip unit':
                case 'skip size':
                case 'skip quantity':
                    setItem(null);
                    setHighlighted(0);
                    break;
                case 'add new prep method':
                    openPopover('prepMethod');
                    break;
                default:
                    if (/^use ".*" as unit$/.test(item.value)) {
                        openPopover('bespokeUnit');
                    } else if (/^use ".*" as prep method$/.test(item.value)) {
                        saveBespokePrepMethod({
                            variables: {
                                record: {
                                    value: strValue,
                                    unique: false,
                                },
                            },
                        });
                        setHighlighted(0);
                    }
                    break;
            }
        } else {
            setItem(item.value);
            setHighlighted(0);
        }
    };

    const handleKeyboardEvent = (e: KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'ArrowDown' || e.key === 'ArrowUp' || e.key === 'Enter') {
            e.preventDefault();
        }
        if (e.key === 'ArrowDown' && highlighted < suggestions.length - 1) {
            setHighlighted((index) => (index += 1));
        } else if (e.key === 'ArrowUp' && highlighted > 0) {
            setHighlighted((index) => (index -= 1));
        } else if (e.key === 'Enter') {
            if (highlighted !== -1) {
                handleSelect(suggestions[highlighted]);
            }
        }
    };

    return { highlighted, setHighlighted, handleKeyboardEvent, handleSelect };
}
