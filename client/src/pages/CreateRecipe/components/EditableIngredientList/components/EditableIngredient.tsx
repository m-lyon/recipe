import { Editable, EditablePreview, EditableInput } from '@chakra-ui/react';
import { useOutsideClick, useToast } from '@chakra-ui/react';
import { useRef } from 'react';
import { useQuery } from '@apollo/client';
import { IngredientDropdown } from './IngredientDropdown';
import { EditableIngredient as EditableIngredientType } from '../../../hooks/useIngredientList';
import { IngredientActionHandler, DEFAULT_INGREDIENT_STR } from '../../../hooks/useIngredientList';
import { gql } from '../../../../../__generated__/gql';
import { isPlural } from '../../../../../utils/plural';
import { getDisplayValue } from './UnitDropdownList';

export const GET_UNITS = gql(`
    query GetUnits {
        unitMany {
            _id
            shortSingular
            shortPlural
            longSingular
            longPlural
            preferredNumberFormat
        }
    }
`);

interface Props {
    item: EditableIngredientType;
    actionHandler: IngredientActionHandler;
    fontSize?: string;
}
export function EditableIngredient({ item, actionHandler, fontSize }: Props) {
    const previewRef = useRef<HTMLInputElement | null>(null);
    const inputRef = useRef<HTMLInputElement | null>(null);
    const parentRef = useRef<HTMLDivElement | null>(null);
    const toast = useToast();
    useOutsideClick({
        ref: parentRef,
        handler: () => {
            if (item.quantity !== null) {
                actionHandler.reset();
            }
        },
    });
    const { data: unitData } = useQuery(GET_UNITS);

    const ingredientStr = actionHandler.get.string();

    const onChange = (value: string) => {
        // This function is called to handle recognising the unit when the user types
        // it in manually. It is called when the user types a space after the unit.
        // TODO: should do the same for ingredient name and prep method, and refactor
        // accordingly.
        if (item.state === 'unit' && item.unit.value !== null && value.endsWith(' ')) {
            if (!unitData) {
                return toast({
                    title: 'Error',
                    description: 'Could not load units',
                    status: 'error',
                    duration: 2000,
                    isClosable: false,
                });
            }
            const setItem = actionHandler.set.currentStateItem;
            const plural = isPlural(item.quantity);
            const unitValue = item.unit.value;
            for (const unit of unitData.unitMany) {
                if (plural) {
                    if (unit.longPlural === unitValue || unit.shortPlural === unitValue) {
                        return setItem(getDisplayValue({ value: unit }, plural, true), unit._id);
                    }
                } else {
                    if (unit.longSingular === unitValue || unit.shortSingular === unitValue) {
                        return setItem(getDisplayValue({ value: unit }, plural, true), unit._id);
                    }
                }
            }
        }
        actionHandler.handleChange(value);
    };

    return (
        <div ref={parentRef}>
            <Editable
                value={ingredientStr}
                onMouseDown={(e) => {
                    if (item.quantity !== null) {
                        e.preventDefault();
                    }
                }}
                selectAllOnFocus={false}
                onChange={onChange}
                onCancel={actionHandler.reset}
                textAlign='left'
                fontSize={fontSize}
                color={item.quantity !== null ? '' : 'gray.400'}
                paddingLeft='6px'
                placeholder={DEFAULT_INGREDIENT_STR}
            >
                <EditablePreview ref={previewRef} width={'100%'} placeholder='test' />
                <EditableInput
                    ref={inputRef}
                    value={ingredientStr}
                    _focusVisible={{ outline: 'none' }}
                />
            </Editable>
            <IngredientDropdown
                item={item}
                actionHandler={actionHandler}
                unitData={unitData}
                inputRef={inputRef}
                previewRef={previewRef}
            />
        </div>
    );
}
