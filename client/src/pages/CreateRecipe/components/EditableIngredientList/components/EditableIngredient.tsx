import { Editable, EditablePreview, EditableInput, useOutsideClick } from '@chakra-ui/react';
import { useRef } from 'react';
import { useQuery } from '@apollo/client';
import { IngredientDropdown } from './IngredientDropdown';
import { EditableIngredient as EditableIngredientType } from '../../../hooks/useIngredientList';
import { IngredientActionHandler, DEFAULT_INGREDIENT_STR } from '../../../hooks/useIngredientList';
import { gql } from '../../../../../__generated__/gql';
import { isPlural } from '../../../../../utils/plural';

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
        if (item.state === 'unit' && item.unit.value !== null) {
            const units = unitData?.unitMany.map((unit) => {
                return isPlural(item.quantity) ? unit.longPlural : unit.longSingular;
            });
            if (units?.includes(item.unit.value) && value.endsWith(' ')) {
                return actionHandler.incrementState();
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
