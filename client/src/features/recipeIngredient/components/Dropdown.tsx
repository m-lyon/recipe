import { RefObject, useRef } from 'react';
import { Box, List } from '@chakra-ui/react';
import { LayoutGroup, motion } from 'framer-motion';

import { displayValue } from '@recipe/utils/formatting';
import { DropdownItem } from '@recipe/common/components';

import { Suggestion } from '../utils/suggestions';

interface Props {
    item: EditableRecipeIngredient;
    suggestions: Suggestion[];
    previewRef: RefObject<HTMLInputElement>;
    highlighted: number;
    setHighlighted: (index: number) => void;
    handleSelect: (suggestion: Suggestion) => void;
}
export function Dropdown(props: Props) {
    const { item, suggestions, previewRef, highlighted, setHighlighted, handleSelect } = props;
    const ref = useRef<HTMLUListElement>(null);

    return (
        item.show && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                <Box pb={4} mb={4} zIndex={1} width='100%' position='absolute'>
                    <List
                        color='rgba(0, 0, 0, 0.64)'
                        bg='white'
                        borderRadius='4px'
                        borderBottom={item.show ? '1px solid rgba(0,0,0,0.1)' : undefined}
                        borderLeft={item.show ? '1px solid rgba(0,0,0,0.1)' : undefined}
                        borderRight={item.show ? '1px solid rgba(0,0,0,0.1)' : undefined}
                        boxShadow='6px 5px 8px rgba(0,50,30,0.02)'
                        maxHeight={item.show ? '14em' : undefined}
                        overflowY={item.show ? 'auto' : undefined}
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
                                    isHighlighted={index === highlighted}
                                    setHighlighted={() => setHighlighted(index)}
                                    resetHighlighted={() => setHighlighted(-1)}
                                />
                            ))}
                        </LayoutGroup>
                    </List>
                </Box>
            </motion.div>
        )
    );
}
