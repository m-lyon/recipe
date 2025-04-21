import { forwardRef } from 'react';
import { motion } from 'framer-motion';
import { Box, List, ListRootProps } from '@chakra-ui/react';

interface Props extends ListRootProps {
    open: boolean;
}
export const DropdownList = forwardRef<HTMLUListElement, Props>(
    ({ open, width, children, ...props }, ref) => {
        return (
            open && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                    <Box pb={4} mb={4} zIndex={1} width={width} position='absolute'>
                        <List.Root
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
                        </List.Root>
                    </Box>
                </motion.div>
            )
        );
    }
);
