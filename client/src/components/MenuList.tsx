import { Box, List, ListItem } from '@chakra-ui/react';
import { matchSorter } from 'match-sorter';
import { UseBooleanActions } from '../types/chakra';

// const DEFAULT_MEASUREMENTS = ['cup', 'ml', 'g'];
const DEFAULT_NAMES = ['soy sauce', 'asparagus'];

interface Props {
    show: boolean;
    setShow: UseBooleanActions;
    parentValue: string;
    setValue: (value: string) => void;
    setSelection: (value: string | null) => void;
}
export function MenuList(props: Props) {
    const { show, setShow, parentValue, setValue, setSelection } = props;
    const filteredItems = matchSorter(DEFAULT_NAMES, parentValue);
    const suggestionList = filteredItems.map((item, index) => (
        <ListItem
            px={2}
            py={1}
            key={`${item}${index}`}
            _hover={{ bg: 'gray.100' }}
            onClick={() => {
                setValue(item);
                console.log('clicked');
                setShow.off();
            }}
            onMouseEnter={() => setSelection(item)}
            onMouseLeave={() => setSelection(null)}
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
