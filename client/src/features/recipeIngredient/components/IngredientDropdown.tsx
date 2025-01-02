import { RefObject } from 'react';
import { Box } from '@chakra-ui/react';
import { TbSoup } from 'react-icons/tb';
import { LayoutGroup, motion } from 'framer-motion';

import { displayValue } from '@recipe/utils/formatting';
import { DropdownItem, DropdownList } from '@recipe/common/components';

import { Suggestion } from '../utils/suggestions';

interface Props {
    item: EditableRecipeIngredient;
    suggestions: Suggestion[];
    listRef: RefObject<HTMLUListElement>;
    previewRef?: RefObject<HTMLInputElement>;
    active: number;
    setActive: (index: number) => void;
    handleSelect: (suggestion: Suggestion) => void;
}
export function IngredientDropdown(props: Props) {
    const { item, suggestions, listRef, previewRef, active, setActive, handleSelect } = props;

    return (
        item.showDropdown && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                <Box pb={4} mb={4} zIndex={1} width='100%' position='absolute'>
                    <DropdownList aria-label='Dropdown suggestion list' ref={listRef}>
                        <LayoutGroup>
                            {suggestions.map((i, index) => {
                                return (
                                    <DropdownItem
                                        key={index}
                                        color={i.colour}
                                        value={displayValue(item, i.value)}
                                        icon={
                                            typeof i.value === 'object' &&
                                            i.value.__typename === 'Recipe'
                                                ? TbSoup
                                                : undefined
                                        }
                                        onClick={() => {
                                            handleSelect(i);
                                            previewRef?.current?.focus();
                                        }}
                                        isHighlighted={index === active}
                                        setHighlighted={() => setActive(index)}
                                    />
                                );
                            })}
                        </LayoutGroup>
                    </DropdownList>
                </Box>
            </motion.div>
        )
    );
}
