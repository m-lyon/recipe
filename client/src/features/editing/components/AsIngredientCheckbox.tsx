import { motion } from 'framer-motion';
import { useShallow } from 'zustand/shallow';
import { Checkbox, HStack, Input, Text, VStack } from '@chakra-ui/react';

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
            <VStack width='100%' justifyContent='flex-end'>
                <HStack width='100%'>
                    <Checkbox
                        isChecked={isIngredient}
                        onChange={toggleIsIngredient}
                        colorScheme='teal'
                        aria-label='Toggle recipe as ingredient'
                    />
                    <Text fontWeight='medium' color={isIngredient ? undefined : 'gray.400'}>
                        Register recipe as ingredient
                    </Text>
                </HStack>
                {isIngredient && (
                    <Input
                        placeholder='Plural title'
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
