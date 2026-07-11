import { motion } from 'framer-motion';
import { Checkbox } from '@mantine/core';
import { useShallow } from 'zustand/shallow';
import { Input, VStack } from '@chakra-ui/react';

import { useRecipeStore } from '@recipe/stores';

export function AsIngredientCheckbox() {
    const { isIngredient, pluralTitle, toggleIsIngredient, setPluralTitle } = useRecipeStore(
        useShallow((state) => ({
            isIngredient: state.isIngredient,
            pluralTitle: state.pluralTitle,
            toggleIsIngredient: state.toggleIsIngredient,
            setPluralTitle: state.setPluralTitle,
        }))
    );

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            layout='position'
            style={{ width: '100%', justifyContent: 'center', display: 'flex' }}
        >
            <VStack width='100%' justifyContent='flex-end' alignItems='flex-start'>
                <Checkbox
                    variant='chakra-style'
                    checked={isIngredient}
                    onChange={toggleIsIngredient}
                    label='Register recipe as ingredient'
                    aria-label='Toggle recipe as ingredient'
                />
                {isIngredient && (
                    <Input
                        placeholder='Plural title'
                        sx={{ '&::placeholder': { color: 'gray.400' } }}
                        fontWeight='medium'
                        value={pluralTitle ?? ''}
                        onChange={(e) => setPluralTitle(e.target.value)}
                        variant='unstyled'
                        aria-label='Edit recipe plural title'
                    />
                )}
            </VStack>
        </motion.div>
    );
}
