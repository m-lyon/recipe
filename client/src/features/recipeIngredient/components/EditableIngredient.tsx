import { useRef, useState } from 'react';
import { useShallow } from 'zustand/shallow';
import { useMutation } from '@apollo/client';
import { useBreakpointValue } from '@chakra-ui/react';
import { Popover, PopoverAnchor, useOutsideClick } from '@chakra-ui/react';
import { Box, Editable, EditableInput, EditablePreview } from '@chakra-ui/react';

import { DEBUG } from '@recipe/constants';
import { useRecipeStore } from '@recipe/stores';
import { useErrorToast } from '@recipe/common/hooks';
import { DELETE_UNIT } from '@recipe/graphql/mutations/unit';
import { NewBespokeUnitPopover, NewIngredientPopover } from '@recipe/features/popovers';
import { NewPrepMethodPopover, NewSizePopover, NewUnitPopover } from '@recipe/features/popovers';

import { Dropdown } from './Dropdown';
import { getSuggestions } from '../utils/suggestions';
import { useDropdownList } from '../hooks/useDropdownList';
import { useEditableIngredient } from '../hooks/useEditableIngredient';
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
    const { item, reset, open, numFinished, setPopover } = useRecipeStore(
        useShallow((state) => ({
            item: state.ingredientSections[section].editable,
            reset: state.resetEditableIngredient,
            open: state.showIngredientDropdown,
            numFinished: state.ingredientSections[section].finished.length,
            setPopover: state.setIngredientPopover,
        }))
    );
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
        setActive(0);
        reset(section);
        if (item.unit.data && !item.unit.data.unique) {
            deleteUnit({ variables: { id: item.unit.data._id } });
        }
    };
    useOutsideClick({
        ref: parentRef,
        handler: () => {
            if (item.quantity !== null || item.showDropdown) {
                handleReset();
            }
        },
    });
    const suggestions = getSuggestions(item, data, attributeStr);
    const openPopover = (type: PopoverType) => {
        if (type === 'bespokeUnit') {
            setBespokeValue(attributeStr);
        }
        setPopover(section, type);
    };
    const { setActive, handleKeyboardEvent, handleSelect, ...dropdownProps } = useDropdownList(
        attributeStr,
        suggestions,
        setIngredientAttribute,
        openPopover,
        () => deleteChar(section),
        listRef
    );

    const getPopover = () => {
        const popoverProps = {
            fieldRef,
            onClose: () => {
                setPopover(section, null);
                previewRef.current?.focus();
            },
            setItem: (attr: RecipeIngredientDropdown) => handleSelect({ value: attr }),
        };
        switch (item.popover) {
            case 'unit':
                return <NewUnitPopover {...popoverProps} />;
            case 'bespokeUnit':
                return (
                    <NewBespokeUnitPopover
                        {...popoverProps}
                        value={bespokeValue}
                        setValue={setBespokeValue}
                    />
                );
            case 'size':
                return <NewSizePopover {...popoverProps} />;
            case 'ingredient':
                return <NewIngredientPopover {...popoverProps} />;
            case 'prepMethod':
                return <NewPrepMethodPopover {...popoverProps} />;
            default:
                return null;
        }
    };

    return (
        // Position relative is needed for the dropdown to be positioned correctly
        <Box ref={parentRef} position='relative'>
            <Popover
                isOpen={item.popover !== null}
                onClose={() => setPopover(section, null)}
                closeOnBlur={false}
                placement={useBreakpointValue({ base: 'bottom', md: 'right' })}
                initialFocusRef={fieldRef}
                returnFocusOnClose={true}
            >
                <PopoverAnchor>
                    <Editable
                        value={editableStr}
                        onMouseDown={(e) => {
                            if (item.quantity !== null) {
                                e.preventDefault();
                                previewRef.current?.focus();
                            }
                        }}
                        selectAllOnFocus={false}
                        onChange={handleIngredientChange}
                        onCancel={handleReset}
                        onEdit={() => open(section)}
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
                        <EditablePreview
                            ref={previewRef}
                            width='100%'
                            aria-label={`Enter ingredient #${numFinished + 1} for subsection ${section + 1}`}
                        />
                        <EditableInput
                            ref={inputRef}
                            value={attributeStr}
                            _focusVisible={{ outline: 'none' }}
                            onKeyDown={handleKeyboardEvent}
                            aria-label={`Input ingredient #${numFinished + 1} for subsection ${section + 1}`}
                        />
                    </Editable>
                </PopoverAnchor>
                <Dropdown
                    suggestions={suggestions}
                    item={item}
                    show={item.showDropdown}
                    listRef={listRef}
                    previewRef={previewRef}
                    handleSelect={handleSelect}
                    setActive={setActive}
                    {...dropdownProps}
                />
                {getPopover()}
            </Popover>
        </Box>
    );
}
