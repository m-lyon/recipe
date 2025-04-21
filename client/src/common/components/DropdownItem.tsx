import { motion } from 'framer-motion';
import { HStack, Icon, List, Text } from '@chakra-ui/react';

interface Props {
    color?: string;
    value: string;
    icon?: React.ReactNode;
    onClick: () => void;
    isHighlighted: boolean;
    setHighlighted: () => void;
}
export function DropdownItem(props: Props) {
    const { color, value, icon, onClick, isHighlighted, setHighlighted } = props;

    return (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <List.Item
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
                    {icon ? <Icon>{icon}</Icon> : undefined}
                </HStack>
            </List.Item>
        </motion.div>
    );
}
