import { Children, ReactNode } from 'react';
import { Box, Center, Wrap, WrapItem } from '@chakra-ui/react';

interface Props {
    children: ReactNode;
}

export function RecipeActionButtons(props: Props) {
    const { children } = props;
    const actionChildren = Children.toArray(children).filter((child) => child != null);
    const isSingleButton = actionChildren.length === 1;

    return (
        <Center>
            <Box position='fixed' bottom='4' pb='3' px='4' width='100%' maxW='100vw'>
                <Wrap
                    justify='center'
                    spacing='3'
                    data-testid='recipe-action-buttons'
                    sx={{
                        width: 'min(calc(100vw - 2rem), 32rem)',
                        marginInline: 'auto',
                        flexWrap: 'wrap',
                    }}
                >
                    {actionChildren.map((child, index) => (
                        <WrapItem
                            key={index}
                            data-testid='recipe-action-button-item'
                            sx={
                                isSingleButton
                                    ? { flex: '0 0 auto', justifyContent: 'center' }
                                    : { flex: '1 1 14rem' }
                            }
                        >
                            {child}
                        </WrapItem>
                    ))}
                </Wrap>
            </Box>
        </Center>
    );
}
