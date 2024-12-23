import { RefObject } from 'react';
import { TbSoup } from 'react-icons/tb';
import { Box, List } from '@chakra-ui/react';
import { LayoutGroup, motion } from 'framer-motion';

import { displayValue } from '@recipe/utils/formatting';
import { DropdownItem } from '@recipe/common/components';

import { Suggestion } from '../utils/suggestions';

interface Props {
    item: EditableRecipeIngredient;
    show: boolean;
    suggestions: Suggestion[];
    listRef: RefObject<HTMLUListElement>;
    previewRef?: RefObject<HTMLInputElement>;
    active: number;
    setActive: (index: number) => void;
    handleSelect: (suggestion: Suggestion) => void;
}
export function Dropdown(props: Props) {
    const { item, show, suggestions, listRef, previewRef, active, setActive, handleSelect } = props;

    return (
        show && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                <Box pb={4} mb={4} zIndex={1} width='100%' position='absolute'>
                    <List
                        color='rgba(0, 0, 0, 0.64)'
                        bg='white'
                        borderRadius='4px'
                        borderBottom='1px solid rgba(0,0,0,0.1)'
                        borderLeft='1px solid rgba(0,0,0,0.1)'
                        borderRight='1px solid rgba(0,0,0,0.1)'
                        boxShadow='6px 5px 8px rgba(0,50,30,0.02)'
                        maxHeight='14em'
                        overflowY='auto'
                        aria-label='Dropdown suggestion list'
                        ref={listRef}
                    >
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
                                        resetHighlighted={() => setActive(-1)}
                                    />
                                );
                            })}
                        </LayoutGroup>
                    </List>
                </Box>
            </motion.div>
        )
    );
}
