import { ReactNode } from 'react';
import { number, object } from 'yup';
import { useShallow } from 'zustand/shallow';
import { AddIcon, MinusIcon } from '@chakra-ui/icons';
import { Button, IconButton } from '@chakra-ui/react';

import { useRecipeStore } from '@recipe/stores';
import { useErrorToast } from '@recipe/common/hooks';

interface Props {
    info?: ReactNode;
}
export function Servings(props: Props) {
    const { info } = props;
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
                icon={<MinusIcon />}
                size='xs'
                onClick={() => {
                    schema
                        .validate({ numServings: num - 1 })
                        .then(() => decrease())
                        .catch((err) => {
                            toast({ title: 'Error', description: err.message });
                        });
                }}
            />
            <Button
                as='div'
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
                {info}
            </Button>
            <IconButton
                position='static'
                variant='outline'
                borderLeft={0}
                borderLeftRadius={0}
                aria-label='Increase serving size'
                icon={<AddIcon />}
                size='xs'
                onClick={() => {
                    schema
                        .validate({ numServings: num + 1 })
                        .then(() => increase())
                        .catch((err) => {
                            toast({ title: 'Error', description: err.message });
                        });
                }}
            />
        </>
    );
}
