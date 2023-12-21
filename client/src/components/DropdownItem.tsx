import { motion } from 'framer-motion';
import { ListItem } from '@chakra-ui/react';
import { forwardRef } from 'react';

interface Props {
    color?: string;
    value: string;
    onClick: () => void;
    isHighlighted: boolean;
    setHighlighted: () => void;
    resetHighlighted: () => void;
}
export const DropdownItem = forwardRef((props: Props, ref: any) => {
    const { color, value, onClick, isHighlighted, setHighlighted, resetHighlighted } = props;

    return (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <ListItem
                px={2}
                py={1}
                onClick={onClick}
                onMouseEnter={setHighlighted}
                onMouseLeave={resetHighlighted}
                cursor='default'
                color={color}
                background={isHighlighted ? 'gray.100' : undefined}
                ref={ref}
            >
                {value}
            </ListItem>
        </motion.div>
    );
});
