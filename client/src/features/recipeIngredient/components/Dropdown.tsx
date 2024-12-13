import { Box, List } from '@chakra-ui/react';
import { LayoutGroup, motion } from 'framer-motion';
import { RefObject, useEffect, useRef } from 'react';

import { displayValue } from '@recipe/utils/formatting';
import { DropdownItem } from '@recipe/common/components';

import { Suggestion } from '../utils/suggestions';

interface Props {
    item: EditableRecipeIngredient;
    show: boolean;
    suggestions: Suggestion[];
    previewRef: RefObject<HTMLInputElement>;
    activeIndex: number;
    setActiveIndex: (index: number) => void;
    handleSelect: (suggestion: Suggestion) => void;
}
export function Dropdown(props: Props) {
    const { item, show, suggestions, previewRef, activeIndex, setActiveIndex, handleSelect } =
        props;
    const ref = useRef<HTMLUListElement>(null);

    useEffect(() => {
        // Scroll the active item into view if it exists
        if (activeIndex !== -1 && ref.current) {
            const activeItem = ref.current.children[activeIndex];
            activeItem?.scrollIntoView({ block: 'nearest' });
        }
    }, [activeIndex]);

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
                        ref={ref}
                    >
                        <LayoutGroup>
                            {suggestions.map((i, index) => (
                                <DropdownItem
                                    key={index}
                                    color={i.colour}
                                    value={displayValue(item, i.value)}
                                    onClick={() => {
                                        handleSelect(i);
                                        previewRef?.current?.focus();
                                        ref.current?.scrollTo({ top: 0, behavior: 'instant' });
                                    }}
                                    isHighlighted={index === activeIndex}
                                    setHighlighted={() => setActiveIndex(index)}
                                    resetHighlighted={() => setActiveIndex(-1)}
                                />
                            ))}
                        </LayoutGroup>
                    </List>
                </Box>
            </motion.div>
        )
    );
}
