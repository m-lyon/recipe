import { Button, IconButton } from '@chakra-ui/react';
import { AddIcon, MinusIcon } from '@chakra-ui/icons';
import { Dispatch, SetStateAction } from 'react';
import { object, number } from 'yup';
import { useToast } from '@chakra-ui/react';

export interface ServingsProps {
    num: number;
    setNum: Dispatch<SetStateAction<number>>;
}
export function Servings(props: ServingsProps) {
    const { num, setNum } = props;
    const toast = useToast();
    const schema = object().shape({
        numServings: number()
            .min(1, 'Number of servings must be a positive number')
            .max(50, 'Maximum servings reached'),
    });
    return (
        <>
            <IconButton
                position='static'
                variant='outline'
                borderRight={0}
                borderRightRadius={0}
                aria-label='minus'
                icon={<MinusIcon />}
                size='xs'
                onClick={() => {
                    schema
                        .validate({ numServings: num - 1 })
                        .then(() => setNum((num) => num - 1))
                        .catch((err) => {
                            toast({
                                title: 'Error',
                                description: err.message,
                                status: 'error',
                                duration: 3000,
                                isClosable: false,
                            });
                        });
                }}
            />
            <Button
                position='static'
                variant='outline'
                borderLeftRadius={0}
                borderRightRadius={0}
                size='xs'
                paddingRight={num === 1 ? 4 : 2}
                sx={{
                    cursor: 'default',
                    ':hover': { bg: 'inherit', color: 'inherit' },
                    ':active': { bg: 'inherit', color: 'inherit' },
                    pointerEvents: 'none',
                    userSelect: 'none',
                }}
            >
                {`${num} Serving${num === 1 ? '' : 's'}`}
            </Button>
            <IconButton
                position='static'
                variant='outline'
                borderLeft={0}
                borderLeftRadius={0}
                aria-label='plus'
                icon={<AddIcon />}
                size='xs'
                onClick={() => {
                    schema
                        .validate({ numServings: num + 1 })
                        .then(() => setNum((num) => num + 1))
                        .catch((err) => {
                            toast({
                                title: 'Error',
                                description: err.message,
                                status: 'error',
                                duration: 3000,
                                isClosable: false,
                            });
                        });
                }}
            />
        </>
    );
}
