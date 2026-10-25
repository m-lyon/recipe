import { ReactNode, RefObject, useRef } from 'react';
import { useBreakpointValue } from '@chakra-ui/react';
import { Popover, PopoverAnchor, useOutsideClick } from '@chakra-ui/react';
import { Box, Editable, EditableInput, EditablePreview } from '@chakra-ui/react';

import { useErrorToast } from '@recipe/common/hooks';

import { Suggestion } from '../utils/suggestions';
import { IngredientDropdown } from './IngredientDropdown';
import { useIngredientDropdown } from '../hooks/useIngredientDropdown';

interface PopoverProps {
    fieldRef: RefObject<HTMLInputElement>;
    onClose: () => void;
    setItem: (attr: RecipeIngredientDropdown) => void;
}
interface Props {
    item: EditableRecipeIngredient;
    /** Everything typed so far. */
    text: string;
    /** The text of the step current being typed. */
    attributeText: string;
    suggestions: Suggestion[];
    placeholder: string;
    previewLabel: string;
    inputLabel: string;
    fontSize?: string;
    onEdit: () => void;
    onChange: (value: string) => void;
    setAttribute: (attr: SetAttr) => void;
    deleteChar: () => void;
    onReset: () => void;
    openPopover?: (type: PopoverType) => void;
    closePopover?: () => void;
    renderPopover?: (props: PopoverProps) => ReactNode;
}

export function EditableItem(props: Props) {
    const { item, text, attributeText, suggestions, placeholder, fontSize } = props;
    const { onEdit, onChange, setAttribute, deleteChar, onReset } = props;
    const { openPopover, closePopover, renderPopover } = props;
    const previewRef = useRef<HTMLInputElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);
    const parentRef = useRef<HTMLDivElement>(null);
    const fieldRef = useRef<HTMLInputElement>(null);
    const listRef = useRef<HTMLUListElement>(null);
    const toast = useErrorToast();

    const showErrors = (action: () => void) => {
        try {
            action();
        } catch (e: unknown) {
            if (e instanceof Error) {
                toast({ title: 'Invalid input', description: e.message });
            }
        }
    };
    const { handleSetActive, onKeyDown, handleSelect, active } = useIngredientDropdown(
        attributeText,
        suggestions,
        (attr) => showErrors(() => setAttribute(attr)),
        openPopover ?? (() => {}),
        deleteChar,
        listRef
    );
    const handleReset = () => {
        handleSetActive(0);
        onReset();
    };
    useOutsideClick({
        ref: parentRef,
        handler: () => {
            if (item.quantity !== null || item.showDropdown) {
                handleReset();
            }
        },
    });

    return (
        // Position relative is needed for the dropdown to be positioned correctly
        <Box ref={parentRef} position='relative'>
            <Popover
                isOpen={item.popover !== null}
                onClose={() => closePopover?.()}
                closeOnBlur={false}
                placement={useBreakpointValue({ base: 'bottom', md: 'right' })}
                initialFocusRef={fieldRef}
                returnFocusOnClose={true}
            >
                <PopoverAnchor>
                    <Editable
                        value={text}
                        onMouseDown={(e) => {
                            if (item.quantity !== null) {
                                e.preventDefault();
                                previewRef.current?.focus();
                            }
                        }}
                        selectAllOnFocus={false}
                        onChange={(value) => showErrors(() => onChange(value))}
                        onCancel={handleReset}
                        onEdit={onEdit}
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
                        placeholder={item.showDropdown ? `Enter ${item.state}` : placeholder}
                    >
                        <EditablePreview
                            ref={previewRef}
                            width='100%'
                            aria-label={props.previewLabel}
                        />
                        <EditableInput
                            ref={inputRef}
                            value={attributeText}
                            _focusVisible={{ outline: 'none' }}
                            onKeyDown={onKeyDown}
                            aria-label={props.inputLabel}
                        />
                    </Editable>
                </PopoverAnchor>
                <IngredientDropdown
                    suggestions={suggestions}
                    item={item}
                    listRef={listRef}
                    previewRef={previewRef}
                    handleSelect={handleSelect}
                    setActive={handleSetActive}
                    active={active}
                />
                {renderPopover?.({
                    fieldRef,
                    onClose: () => {
                        closePopover?.();
                        previewRef.current?.focus();
                    },
                    setItem: (attr) => handleSelect({ value: attr }),
                })}
            </Popover>
        </Box>
    );
}
