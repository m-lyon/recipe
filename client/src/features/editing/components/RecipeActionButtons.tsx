import { Children, ReactNode } from 'react';
import { Box, Center, Flex } from '@chakra-ui/react';

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
                <Flex
                    justify='center'
                    gap='3'
                    data-testid='recipe-action-buttons'
                    sx={{
                        width: 'min(calc(100vw - 2rem), 32rem)',
                        marginInline: 'auto',
                    }}
                >
                    {actionChildren.map((child, index) => (
                        <Box
                            key={index}
                            data-testid='recipe-action-button-item'
                            sx={
                                isSingleButton
                                    ? { flex: '0 0 auto' }
                                    : index === 0
                                      ? {
                                            flex: '1 1 0',
                                            minWidth: 0,
                                            display: 'flex',
                                            justifyContent: 'flex-end',
                                            paddingRight: '0.5rem',
                                        }
                                      : {
                                            flex: '1 1 0',
                                            minWidth: 0,
                                            display: 'flex',
                                            justifyContent: 'flex-start',
                                            paddingLeft: '0.5rem',
                                        }
                            }
                        >
                            {child}
                        </Box>
                    ))}
                </Flex>
            </Box>
        </Center>
    );
}
