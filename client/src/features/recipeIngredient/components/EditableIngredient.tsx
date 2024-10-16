import { useRef, useState } from 'react';
import { useMutation } from '@apollo/client';
import { useBreakpointValue } from '@chakra-ui/react';
import { Box, Editable, EditableInput, EditablePreview } from '@chakra-ui/react';
import { Popover, PopoverAnchor, useDisclosure, useOutsideClick } from '@chakra-ui/react';

import { DEBUG } from '@recipe/constants';
import { useErrorToast } from '@recipe/common/hooks';
import { DELETE_UNIT } from '@recipe/graphql/mutations/unit';
import { NewBespokeUnitPopover, NewIngredientPopover } from '@recipe/features/popovers';
import { NewPrepMethodPopover, NewSizePopover, NewUnitPopover } from '@recipe/features/popovers';

import { Dropdown } from './Dropdown';
import { getSuggestions } from '../utils/suggestions';
import { useDropdownList } from '../hooks/useDropdownList';
import { IngredientActionHandler } from '../hooks/useIngredientList';

export type PopoverType = 'unit' | 'bespokeUnit' | 'size' | 'ingredient' | 'prepMethod' | 'none';
interface Props {
    subsection: number;
    item: EditableRecipeIngredient;
    actionHandler: IngredientActionHandler;
    queryData: IngredientComponentQuery;
    ingredientNum: number;
    fontSize?: string;
}
export function EditableIngredient(props: Props) {
    const { subsection, item, actionHandler, queryData, ingredientNum, fontSize } = props;
    const previewRef = useRef<HTMLInputElement | null>(null);
    const inputRef = useRef<HTMLInputElement | null>(null);
    const parentRef = useRef<HTMLDivElement | null>(null);
    const fieldRef = useRef<HTMLInputElement | null>(null);
    const [popover, setPopover] = useState<PopoverType>('unit');
    const [bespokeValue, setBespokeValue] = useState('');
    const toast = useErrorToast();
    const { isOpen, onOpen, onClose } = useDisclosure({
        onClose: () => {
            setPopover('none');
            previewRef.current?.focus();
        },
    });
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
        setHighlighted(0);
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
    const strValue = actionHandler.currentEditableAttributeValue(subsection) ?? '';
    const suggestions = getSuggestions(item, queryData, strValue);
    const openPopover = (type: PopoverType) => {
        setPopover(type);
        if (type === 'bespokeUnit') {
            setBespokeValue(actionHandler.currentEditableAttributeValue(subsection) ?? '');
        }
        onOpen();
    };
    const { setHighlighted, handleKeyboardEvent, ...dropdownProps } = useDropdownList(
        strValue,
        suggestions,
        (attr: SetAttr) => actionHandler.setCurrentEditableAttribute(subsection, attr),
        openPopover,
        () => actionHandler.deleteChar(subsection)
    );

    const getPopover = () => {
        const setItem = (attr: RecipeIngredientDropdown) => {
            actionHandler.setCurrentEditableAttribute(subsection, attr);
            setHighlighted(0);
        };
        const popoverProps = { fieldRef, onClose, setItem };
        switch (popover) {
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
                isOpen={isOpen}
                onOpen={onOpen}
                onClose={onClose}
                closeOnBlur={false}
                placement={useBreakpointValue({ base: 'bottom', md: 'right' })}
                initialFocusRef={fieldRef}
                returnFocusOnClose={true}
            >
                <PopoverAnchor>
                    <Editable
                        value={actionHandler.editableStringValue(subsection)}
                        onMouseDown={(e) => {
                            if (item.quantity !== null) {
                                e.preventDefault();
                                previewRef.current?.focus();
                            }
                        }}
                        selectAllOnFocus={false}
                        onChange={(value: string) => {
                            actionHandler.handleEditableChange(subsection, value);
                        }}
                        onCancel={handleReset}
                        onEdit={() => actionHandler.setEditableShow.on(subsection)}
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
                        placeholder='Enter ingredient'
                    >
                        <EditablePreview
                            ref={previewRef}
                            width='100%'
                            aria-label={`Enter ingredient #${ingredientNum} for subsection ${subsection + 1}`}
                        />
                        <EditableInput
                            ref={inputRef}
                            value={strValue}
                            _focusVisible={{ outline: 'none' }}
                            onKeyDown={handleKeyboardEvent}
                            aria-label={`Input ingredient #${ingredientNum} for subsection ${subsection + 1}`}
                        />
                    </Editable>
                </PopoverAnchor>
                <Dropdown
                    suggestions={suggestions}
                    item={item}
                    previewRef={previewRef}
                    setHighlighted={setHighlighted}
                    {...dropdownProps}
                />
                {getPopover()}
            </Popover>
        </Box>
    );
}
