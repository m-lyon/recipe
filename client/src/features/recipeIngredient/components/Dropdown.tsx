import { MutableRefObject } from 'react';
import { useMutation } from '@apollo/client';
import { Box, List } from '@chakra-ui/react';
import { LayoutGroup, motion } from 'framer-motion';

import { useErrorToast } from '@recipe/common/hooks';
import { DropdownItem } from '@recipe/common/components';
import { RecipeIngredientQueryData } from '@recipe/types';
import { CREATE_PREP_METHOD } from '@recipe/graphql/mutations/prepMethod';
import { EditableRecipeIngredient, IngredientAndRecipe } from '@recipe/types';
import { sizeDisplayValue, unitDisplayValue } from '@recipe/utils/formatting';
import { ingredientDisplayValue, prepMethodDisplayValue } from '@recipe/utils/formatting';
import { CreatePrepMethodMutation, PrepMethod, Size, Unit } from '@recipe/graphql/generated';

import { PopoverType } from './EditableIngredient';
import { useDropdownList } from '../hooks/useDropdownList';
import { sizeSuggestions, unitSuggestions } from '../utils/suggestions';
import { IngredientActionHandler, SetAttr } from '../hooks/useIngredientList';
import { ingredientSuggestions, prepMethodSuggestions } from '../utils/suggestions';

type Item = string | Unit | Size | IngredientAndRecipe | PrepMethod;
interface Suggestion {
    value: string | Item;
    colour?: string;
}
interface Props {
    subsection: number;
    item: EditableRecipeIngredient;
    actionHandler: IngredientActionHandler;
    data: RecipeIngredientQueryData;
    inputRef: MutableRefObject<HTMLInputElement | null>;
    previewRef: MutableRefObject<HTMLDivElement | null>;
    openPopover: (type: PopoverType) => void;
}
export function Dropdown(props: Props) {
    const { subsection, item, actionHandler, data, inputRef, previewRef, openPopover } = props;
    const strValue = actionHandler.currentEditableAttributeValue(subsection) ?? '';
    const errorToast = useErrorToast();
    const setItem = (attr: SetAttr) => actionHandler.setCurrentEditableAttribute(subsection, attr);
    const [saveBespokePrepMethod] = useMutation(CREATE_PREP_METHOD, {
        onCompleted: (data: CreatePrepMethodMutation) => {
            setItem(data.prepMethodCreateOne!.record!);
        },
        onError: (error) => {
            errorToast({
                title: 'Error saving unit',
                description: error.message,
                position: 'top',
            });
        },
    });

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
                    break;
                case 'skip unit':
                case 'skip size':
                case 'skip quantity':
                    setItem(null);
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
        }
    };

    // goal is to reset index after setItem is called, and after popover actions have been submitted

    let suggestions: Suggestion[] = [];
    switch (item.state) {
        case 'quantity':
            suggestions = strValue ? [] : [{ value: 'skip quantity', colour: 'gray.400' }];
            break;
        case 'unit':
            suggestions = unitSuggestions(data, strValue);
            break;
        case 'size':
            suggestions = sizeSuggestions(data, strValue);
            break;
        case 'ingredient':
            suggestions = ingredientSuggestions(data, strValue);
            break;
        case 'prepMethod':
            suggestions = prepMethodSuggestions(data, strValue);
            break;
        default:
            suggestions = [];
            break;
    }

    const { highlightedIndex, setHighlightedIndex } = useDropdownList<Suggestion>(
        suggestions,
        handleSelect,
        inputRef
    );

    const displayValue = (i: Item | string): string => {
        if (typeof i === 'string') {
            return i;
        }
        switch (i?.__typename) {
            case 'Unit':
                return unitDisplayValue(item.quantity, i, false);
            case 'Size':
                return sizeDisplayValue(i);
            case 'Ingredient':
            case 'Recipe':
                return ingredientDisplayValue(item.quantity, item.unit.data ?? null, i);
            case 'PrepMethod':
                return prepMethodDisplayValue(i);
            default:
                return '';
        }
    };

    return (
        item.show && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                <Box pb={4} mb={4} zIndex={1} width='100%' position='absolute'>
                    <List
                        color='rgba(0, 0, 0, 0.64)'
                        bg='white'
                        borderRadius='4px'
                        borderBottom={item.show ? '1px solid rgba(0,0,0,0.1)' : undefined}
                        borderLeft={item.show ? '1px solid rgba(0,0,0,0.1)' : undefined}
                        borderRight={item.show ? '1px solid rgba(0,0,0,0.1)' : undefined}
                        boxShadow='6px 5px 8px rgba(0,50,30,0.02)'
                        maxHeight={item.show ? '14em' : undefined}
                        overflowY={item.show ? 'auto' : undefined}
                    >
                        <LayoutGroup>
                            {suggestions.map((item, index) => (
                                <DropdownItem
                                    key={index}
                                    color={item.colour}
                                    value={displayValue(item.value)}
                                    onClick={() => {
                                        handleSelect(item);
                                        previewRef?.current?.focus();
                                    }}
                                    isHighlighted={index === highlightedIndex}
                                    setHighlighted={() => setHighlightedIndex(index)}
                                    resetHighlighted={() => setHighlightedIndex(-1)}
                                />
                            ))}
                        </LayoutGroup>
                    </List>
                </Box>
            </motion.div>
        )
    );
}
