import { forwardRef } from 'react';
import { motion } from 'framer-motion';
import { Box, List, ListProps } from '@chakra-ui/react';

interface Props extends ListProps {
    isOpen: boolean;
}
export const DropdownList = forwardRef(({ isOpen, width, children, ...props }: Props, ref) => {
    return (
        isOpen && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                <Box pb={4} mb={4} zIndex={1} width={width} position='absolute'>
                    <List
                        ref={ref}
                        color='rgba(0, 0, 0, 0.64)'
                        bg='white'
                        borderRadius='4px'
                        borderBottom='1px solid rgba(0,0,0,0.1)'
                        borderLeft='1px solid rgba(0,0,0,0.1)'
                        borderRight='1px solid rgba(0,0,0,0.1)'
                        boxShadow='6px 5px 8px rgba(0,50,30,0.02)'
                        maxHeight='14em'
                        overflowY='auto'
                        {...props}
                    >
                        {children}
                    </List>
                </Box>
            </motion.div>
        )
    );
});
