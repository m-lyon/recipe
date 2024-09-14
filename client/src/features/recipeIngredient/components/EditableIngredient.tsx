import { useRef } from 'react';
import { useMutation } from '@apollo/client';
import { useOutsideClick } from '@chakra-ui/react';
import { Box, Editable, EditableInput, EditablePreview } from '@chakra-ui/react';

import { DEBUG } from '@recipe/constants';
import { useErrorToast } from '@recipe/common/hooks';
import { EditableRecipeIngredient } from '@recipe/types';
import { RecipeIngredientQueryData } from '@recipe/types';
import { DELETE_UNIT } from '@recipe/graphql/mutations/unit';

import { IngredientActionHandler } from '../hooks/useIngredientList';
import { RecipeIngredientDropdown } from './RecipeIngredientDropdown';

interface Props {
    subsection: number;
    item: EditableRecipeIngredient;
    actionHandler: IngredientActionHandler;
    queryData: RecipeIngredientQueryData;
    ingredientNum: number;
    fontSize?: string;
}
export function EditableIngredient(props: Props) {
    const { subsection, item, actionHandler, queryData, ingredientNum, fontSize } = props;
    const previewRef = useRef<HTMLInputElement | null>(null);
    const inputRef = useRef<HTMLInputElement | null>(null);
    const parentRef = useRef<HTMLDivElement | null>(null);
    const toast = useErrorToast();
    const [deleteUnit] = useMutation(DELETE_UNIT, {
        onCompleted: (data) => {
            if (DEBUG) {
                console.log(`Successfully deleted unit ${data.unitRemoveById?.recordId}`);
            }
        },
        onError: (error) => {
            toast({
                title: 'Error saving unit',
                description: error.message,
                position: 'top',
            });
        },
        update(cache, { data }) {
            cache.evict({ id: `Unit:${data?.unitRemoveById?.recordId}` });
        },
    });
    const handleReset = () => {
        actionHandler.resetEditable(subsection);
        if (item.unit.data && !item.unit.data.unique) {
            deleteUnit({ variables: { id: item.unit.data._id } });
        }
    };
    useOutsideClick({
        ref: parentRef,
        handler: () => {
            if (item.quantity !== null || item.show) {
                handleReset();
            }
        },
    });

    const ingredientStr = actionHandler.editableStringValue(subsection);

    return (
        // Position relative is needed for the dropdown to be positioned correctly
        <Box ref={parentRef} position='relative'>
            <Editable
                value={ingredientStr}
                onMouseDown={(e) => {
                    if (item.quantity !== null) {
                        e.preventDefault();
                        previewRef.current?.focus();
                    }
                }}
                selectAllOnFocus={false}
                onKeyDown={(e) => {
                    if (
                        e.key === 'Backspace' &&
                        ingredientStr === '' &&
                        item.state !== 'quantity'
                    ) {
                        actionHandler.decrementEditableState(subsection, 'quantity');
                    }
                }}
                onChange={(value: string) => actionHandler.handleEditableChange(subsection, value)}
                onCancel={handleReset}
                onEdit={() => actionHandler.setEditableShow.on(subsection)}
                textAlign='left'
                fontSize={fontSize}
                color={item.quantity !== null || item.ingredient.value !== null ? '' : 'gray.400'}
                pl='0px'
                placeholder='Enter ingredient'
            >
                <EditablePreview
                    ref={previewRef}
                    width='100%'
                    aria-label={`Enter ingredient #${ingredientNum} for subsection ${subsection + 1}`}
                />
                <EditableInput
                    ref={inputRef}
                    value={ingredientStr}
                    _focusVisible={{ outline: 'none' }}
                />
            </Editable>
            <RecipeIngredientDropdown
                subsection={subsection}
                item={item}
                actionHandler={actionHandler}
                queryData={queryData}
                inputRef={inputRef}
                previewRef={previewRef}
            />
        </Box>
    );
}
