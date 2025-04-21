import { number, object } from 'yup';
import { useShallow } from 'zustand/shallow';
import { FaMinus, FaPlus } from 'react-icons/fa6';
import { Button, IconButton } from '@chakra-ui/react';

import { useRecipeStore } from '@recipe/stores';
import { useErrorToast } from '@recipe/common/hooks';

export function Servings() {
    const { num, increase, decrease } = useRecipeStore(
        useShallow((state) => ({
            num: state.numServings,
            increase: state.increaseNumServings,
            decrease: state.decreaseNumServings,
        }))
    );
    const toast = useErrorToast();
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
                aria-label='Decrease serving size'
                size='xs'
                onClick={() => {
                    schema
                        .validate({ numServings: num - 1 })
                        .then(() => decrease())
                        .catch((err) => {
                            toast({ title: 'Error', description: err.message });
                        });
                }}
            >
                <FaMinus />
            </IconButton>
            <Button
                position='static'
                variant='outline'
                borderLeftRadius={0}
                borderRightRadius={0}
                size='xs'
                paddingRight={num === 1 ? 4 : 2}
                css={{
                    '& cursor': 'default',
                    '& :hover': { bg: 'inherit', color: 'inherit' },
                    '& :active': { bg: 'inherit', color: 'inherit' },
                    '& pointerEvents': 'none',
                    '& userSelect': 'none',
                }}
            >
                {`${num} Serving${num === 1 ? '' : 's'}`}
            </Button>
            <IconButton
                position='static'
                variant='outline'
                borderLeft={0}
                borderLeftRadius={0}
                aria-label='Increase serving size'
                size='xs'
                onClick={() => {
                    schema
                        .validate({ numServings: num + 1 })
                        .then(() => increase())
                        .catch((err) => {
                            toast({ title: 'Error', description: err.message });
                        });
                }}
            >
                <FaPlus />
            </IconButton>
        </>
    );
}
