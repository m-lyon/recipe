import { useMutation } from '@apollo/client';
import { KeyboardEvent, useEffect, useState } from 'react';

import { useErrorToast } from '@recipe/common/hooks';
import { CreatePrepMethodMutation } from '@recipe/graphql/generated';
import { CREATE_PREP_METHOD } from '@recipe/graphql/mutations/prepMethod';

import { Suggestion } from '../utils/suggestions';
import { PopoverType } from '../components/EditableIngredient';

export function useDropdownList(
    strValue: string,
    suggestions: Suggestion[],
    setItem: (attr: SetAttr) => void,
    openPopover: (type: PopoverType) => void,
    deleteChar: () => void
) {
    const toast = useErrorToast();
    const [activeIndex, setActiveIndex] = useState(0);
    const [saveBespokePrepMethod] = useMutation(CREATE_PREP_METHOD, {
        onCompleted: (data: CreatePrepMethodMutation) => {
            setItem(data.prepMethodCreateOne!.record!);
            setActiveIndex(0);
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
        if (activeIndex > suggestions.length - 1) {
            setActiveIndex(Math.max(suggestions.length - 1, 0));
        }
    }, [activeIndex, suggestions.length]);

    const handleSelect = (item: Suggestion | undefined) => {
        if (!item) {
            setItem(undefined);
            setActiveIndex(0);
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
                case 'skip prep method':
                    setItem(null);
                    setActiveIndex(0);
                    break;
                case 'skip unit':
                case 'skip size':
                case 'skip quantity':
                    setItem(null);
                    setActiveIndex(0);
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
                    }
                    break;
            }
        } else {
            setItem(item.value);
            setActiveIndex(0);
        }
    };

    const handleKeyboardEvent = (e: KeyboardEvent<HTMLInputElement>) => {
        if (['ArrowDown', 'ArrowUp', 'Enter', 'Backspace'].includes(e.key)) {
            e.preventDefault();
        }
        if (e.key === 'ArrowDown' && activeIndex < suggestions.length - 1) {
            setActiveIndex((index) => (index += 1));
        } else if (e.key === 'ArrowUp' && activeIndex > 0) {
            setActiveIndex((index) => (index -= 1));
        } else if (e.key === 'Enter') {
            if (activeIndex !== -1) {
                handleSelect(suggestions[activeIndex]);
            }
        } else if (e.key === 'Backspace') {
            deleteChar();
        }
    };

    return { activeIndex, setActiveIndex, handleKeyboardEvent, handleSelect };
}
