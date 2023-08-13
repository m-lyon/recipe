import { Box, List, ListItem } from '@chakra-ui/react';
import { matchSorter } from 'match-sorter';
import { Dispatch, SetStateAction, useEffect } from 'react';
import { UseBooleanActions } from '../types/chakra';
import { InputState } from '../hooks/useIngredientList';

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
            amount: { items: [], value: '' },
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

    const suggestionList = filteredItems.map((item, index) => (
        <ListItem
            px={2}
            py={1}
            key={`${item}${index}`}
            _hover={{ bg: 'gray.100' }}
            onClick={() => handleClick(item)}
            onMouseEnter={() => setIsSelecting(true)}
            onMouseLeave={() => setIsSelecting(false)}
            cursor='default'
        >
            {item}
        </ListItem>
    ));
    return (
        show && (
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
                    {suggestionList}
                </List>
            </Box>
        )
    );
}
