import { motion } from 'framer-motion';
import { ListItem } from '@chakra-ui/react';

interface Props {
    color?: string;
    value: string;
    onClick: () => void;
    setIsSelecting: (value: boolean) => void;
}
export function DropdownItem(props: Props) {
    const { color, value, onClick, setIsSelecting } = props;

    return (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <ListItem
                px={2}
                py={1}
                _hover={{ bg: 'gray.100' }}
                _focus={{ bg: 'gray.100' }}
                onClick={onClick}
                onMouseEnter={() => setIsSelecting(true)}
                onMouseLeave={() => setIsSelecting(false)}
                cursor='default'
                color={color}
            >
                {value}
            </ListItem>
        </motion.div>
    );
}
