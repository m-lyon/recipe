import { useRef, useState } from 'react';
import { useClickAway } from 'react-use';
import { Popover } from '@chakra-ui/react';
import { useMutation } from '@apollo/client';
import { Box, Editable } from '@chakra-ui/react';
import { useBreakpointValue } from '@chakra-ui/react';

import { DEBUG } from '@recipe/constants';
import { useRecipeStore } from '@recipe/stores';
import { useErrorToast } from '@recipe/common/hooks';
import { DELETE_UNIT } from '@recipe/graphql/mutations/unit';

import { NewItemPopover } from './NewItemPopover';
import { getSuggestions } from '../utils/suggestions';
import { IngredientDropdown } from './IngredientDropdown';
import { useEditableIngredient } from '../hooks/useEditableIngredient';
import { useIngredientDropdown } from '../hooks/useIngredientDropdown';

interface Props {
    section: number;
    fontSize?: string;
}
export function EditableIngredient(props: Props) {
    const { section, fontSize } = props;
    const previewRef = useRef<HTMLInputElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);
    const parentRef = useRef<HTMLDivElement>(null);
    const fieldRef = useRef<HTMLInputElement>(null);
    const listRef = useRef<HTMLUListElement>(null);
    // ------------------ State ------------------
    const item = useRecipeStore((state) => state.ingredientSections[section].editable);
    const reset = useRecipeStore((state) => state.resetEditableIngredient);
    const open = useRecipeStore((state) => state.showIngredientDropdown);
    const numFinished = useRecipeStore(
        (state) => state.ingredientSections[section].finished.length
    );
    const setPopover = useRecipeStore((state) => state.setIngredientPopover);
    const deleteChar = useRecipeStore((state) => state.removeIngredientCharacter);
    const editableStr = useRecipeStore((state) => state.getIngredientString(section));
    const { data, setIngredientAttribute, handleIngredientChange } = useEditableIngredient(section);
    const attributeStr = useRecipeStore((state) => state.getIngredientAttributeString(section));
    const [bespokeValue, setBespokeValue] = useState('');
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
        handleSetActive(0);
        reset(section);
        if (item.unit.data && !item.unit.data.unique) {
            deleteUnit({ variables: { id: item.unit.data._id } });
        }
    };
    useClickAway(parentRef, () => {
        if (item.quantity !== null || item.showDropdown) {
            handleReset();
        }
    });
    const suggestions = getSuggestions(item, data, attributeStr);
    const openPopover = (type: PopoverType) => {
        if (type === 'bespokeUnit') {
            setBespokeValue(attributeStr);
        }
        setPopover(section, type);
    };
    const { handleSetActive, onKeyDown, handleSelect, active } = useIngredientDropdown(
        attributeStr,
        suggestions,
        setIngredientAttribute,
        openPopover,
        () => deleteChar(section),
        listRef
    );

    return (
        // Position relative is needed for the dropdown to be positioned correctly
        <Box ref={parentRef} position='relative'>
            <Popover.Root
                open={item.popover !== null}
                onOpenChange={() => setPopover(section, null)}
                positioning={{ placement: useBreakpointValue({ base: 'bottom', md: 'right' }) }}
                initialFocusEl={() => fieldRef.current}
                // returnFocusOnClose={true} // This is not supported
            >
                <Popover.Positioner>
                    <Editable.Root
                        value={editableStr}
                        onMouseDown={(e) => {
                            if (item.quantity !== null) {
                                e.preventDefault();
                                previewRef.current?.focus();
                            }
                        }}
                        onValueChange={(e) => handleIngredientChange(e.value)}
                        selectOnFocus={false}
                        onInteractOutside={handleReset}
                        onEditChange={(details) => details.edit && open(section)}
                        textAlign='left'
                        fontSize={fontSize}
                        color={
                            item.quantity !== null ||
                            item.size.value !== null ||
                            item.ingredient.value !== null
                                ? ''
                                : 'gray.400'
                        }
                        pl='0px'
                        placeholder={item.showDropdown ? `Enter ${item.state}` : 'Enter ingredient'}
                    >
                        <Editable.Preview
                            ref={previewRef}
                            width='100%'
                            aria-label={`Enter ingredient #${numFinished + 1} for subsection ${section + 1}`}
                        />
                        <Editable.Input
                            ref={inputRef}
                            value={attributeStr}
                            _focusVisible={{ outline: 'none' }}
                            onKeyDown={onKeyDown}
                            aria-label={`Input ingredient #${numFinished + 1} for subsection ${section + 1}`}
                        />
                    </Editable.Root>
                </Popover.Positioner>
                <IngredientDropdown
                    suggestions={suggestions}
                    item={item}
                    listRef={listRef}
                    previewRef={previewRef}
                    handleSelect={handleSelect}
                    setActive={handleSetActive}
                    active={active}
                />
                <NewItemPopover
                    fieldRef={fieldRef}
                    onClose={() => {
                        setPopover(section, null);
                        previewRef.current?.focus();
                    }}
                    setItem={(attr: RecipeIngredientDropdown) => handleSelect({ value: attr })}
                    item={item}
                    bespokeValue={bespokeValue}
                    setBespokeValue={setBespokeValue}
                />
            </Popover.Root>
        </Box>
    );
}
