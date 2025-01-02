import { motion } from 'framer-motion';
import { IconType } from 'react-icons';
import { HStack, Icon, ListItem, Text } from '@chakra-ui/react';

interface Props {
    color?: string;
    value: string;
    icon?: IconType;
    onClick: () => void;
    isHighlighted: boolean;
    setHighlighted: () => void;
}
export function DropdownItem(props: Props) {
    const { color, value, icon, onClick, isHighlighted, setHighlighted } = props;

    return (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <ListItem
                px={2}
                py={1}
                onClick={onClick}
                onMouseEnter={setHighlighted}
                cursor='default'
                color={color}
                background={isHighlighted ? 'gray.100' : undefined}
                aria-label={isHighlighted ? `Highlighted selection: ${value}` : value}
            >
                <HStack>
                    <Text>{value}</Text>
                    {icon ? <Icon as={icon} /> : undefined}
                </HStack>
            </ListItem>
        </motion.div>
    );
}
