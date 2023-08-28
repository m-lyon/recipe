import { Box, List, ListItem } from '@chakra-ui/react';
import { matchSorter } from 'match-sorter';
import { Dispatch, SetStateAction, useEffect } from 'react';
import { UseBooleanActions } from '../types/chakra';
import { InputState } from '../hooks/useIngredientList';
import { motion, LayoutGroup } from 'framer-motion';

const MOCK_ITEMS = ['cup', 'ml', 'g'];
const MOCK_NAMES = ['soy sauce', 'asparagus'];

interface Props {
    inputState: InputState;
    show: boolean;
    setShow: UseBooleanActions;
    currentValue: string | null;
    setValue: (value: string) => void;
    setIsSelecting: Dispatch<SetStateAction<boolean>>;
    blurCallback: () => void;
}
export function MenuList(props: Props) {
    const { inputState, show, setShow, currentValue, setValue, setIsSelecting, blurCallback } =
        props;

    const getListSelection = () => {
        // TODO: this will be conntected to backend at some point
        const value = currentValue !== null ? currentValue : '';
        const stateMap = {
            quantity: { items: [], value: '' },
            unit: { items: MOCK_ITEMS, value: value },
            name: { items: MOCK_NAMES, value: value },
        };
        return stateMap[inputState];
    };

    const handleClick = (item: string) => {
        console.log('clicked');
        setValue(item);
        if (inputState === 'name') {
            setShow.off();
            blurCallback();
        }
        setIsSelecting(false);
    };

    const matchItems = getListSelection();
    const filteredItems = matchSorter(matchItems.items, matchItems.value);

    useEffect(() => {
        if (filteredItems.length === 0) {
            setIsSelecting(false);
        }
    }, [filteredItems]);

    const suggestionList = filteredItems.map((item) => (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            key={`${item}`}
        >
            <ListItem
                px={2}
                py={1}
                _hover={{ bg: 'gray.100' }}
                onClick={() => handleClick(item)}
                onMouseEnter={() => setIsSelecting(true)}
                onMouseLeave={() => setIsSelecting(false)}
                cursor='default'
            >
                {item}
            </ListItem>
        </motion.div>
    ));
    return (
        show && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                <Box pb={4} mb={4}>
                    <List
                        color='rgba(0, 0, 0, 0.64)'
                        bg='white'
                        borderRadius='4px'
                        borderBottom={show ? '1px solid rgba(0,0,0,0.1)' : undefined}
                        borderLeft={show ? '1px solid rgba(0,0,0,0.1)' : undefined}
                        borderRight={show ? '1px solid rgba(0,0,0,0.1)' : undefined}
                        boxShadow='6px 5px 8px rgba(0,50,30,0.02)'
                    >
                        <LayoutGroup>{suggestionList}</LayoutGroup>
                    </List>
                </Box>
            </motion.div>
        )
    );
}
