import { forwardRef } from 'react';
import { List, ListProps } from '@chakra-ui/react';

export const DropdownList = forwardRef(({ children, ...props }: ListProps, ref) => {
    return (
        <List
            ref={ref}
            {...props}
            color='rgba(0, 0, 0, 0.64)'
            bg='white'
            borderRadius='4px'
            borderBottom='1px solid rgba(0,0,0,0.1)'
            borderLeft='1px solid rgba(0,0,0,0.1)'
            borderRight='1px solid rgba(0,0,0,0.1)'
            boxShadow='6px 5px 8px rgba(0,50,30,0.02)'
            maxHeight='14em'
            overflowY='auto'
        >
            {children}
        </List>
    );
});
