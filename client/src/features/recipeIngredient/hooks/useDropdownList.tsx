import { useMutation } from '@apollo/client';
import { KeyboardEvent, RefObject, useEffect, useState } from 'react';

import { useErrorToast } from '@recipe/common/hooks';
import { CreatePrepMethodMutation } from '@recipe/graphql/generated';
import { CREATE_PREP_METHOD } from '@recipe/graphql/mutations/prepMethod';

import { Suggestion } from '../utils/suggestions';

export function useDropdownList(
    strValue: string,
    suggestions: Suggestion[],
    setItem: (attr: SetAttr) => void,
    openPopover: (type: PopoverType) => void,
    deleteChar: () => void,
    listRef: RefObject<HTMLUListElement>
) {
    const toast = useErrorToast();
    const [active, setActive] = useState(0);
    const [saveBespokePrepMethod] = useMutation(CREATE_PREP_METHOD, {
        onCompleted: (data: CreatePrepMethodMutation) => {
            setItem(data.prepMethodCreateOne!.record!);
            setActive(0);
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
        if (active > suggestions.length - 1) {
            setActive(Math.max(suggestions.length - 1, 0));
        }
    }, [active, suggestions.length]);

    useEffect(() => {
        // Scroll the active item into view if it exists
        if (active !== -1 && listRef.current) {
            const activeItem = listRef.current.children[active];
            activeItem?.scrollIntoView({ block: 'nearest' });
        }
    }, [active, listRef]);

    const resetView = () => {
        setActive(0);
        listRef.current?.scrollTo({ top: 0, behavior: 'instant' });
    };

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
                            variables: {
                                record: {
                                    value: strValue,
                                    unique: false,
                                },
                            },
                        });
                        resetView();
                    }
                    break;
            }
        } else {
            setItem(item.value);
            resetView();
        }
    };

    const handleKeyboardEvent = (e: KeyboardEvent<HTMLInputElement>) => {
        if (['ArrowDown', 'ArrowUp', 'Enter', 'Backspace'].includes(e.key)) {
            e.preventDefault();
        }
        if (e.key === 'ArrowDown' && active < suggestions.length - 1) {
            setActive((index) => (index += 1));
        } else if (e.key === 'ArrowUp' && active > 0) {
            setActive((index) => (index -= 1));
        } else if (e.key === 'Enter') {
            if (active !== -1) {
                handleSelect(suggestions[active]);
            }
        } else if (e.key === 'Backspace') {
            deleteChar();
        }
    };

    return { active, setActive, handleKeyboardEvent, handleSelect };
}
