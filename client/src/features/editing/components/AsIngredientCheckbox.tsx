import { motion } from 'framer-motion';
import { HStack, Input, Text, VStack } from '@chakra-ui/react';

import { useRecipeStore } from '@recipe/stores';
import { Checkbox } from '@recipe/common/components';

export function AsIngredientCheckbox() {
    const isIngredient = useRecipeStore((state) => state.isIngredient);
    const pluralTitle = useRecipeStore((state) => state.pluralTitle);
    const setIsIngredient = useRecipeStore((state) => state.setIsIngredient);
    const setPluralTitle = useRecipeStore((state) => state.setPluralTitle);

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
                        checked={isIngredient}
                        onCheckedChange={(e) => setIsIngredient(!!e.checked)}
                        colorPalette='teal'
                        aria-label='Toggle recipe as ingredient'
                    />
                    <Text fontWeight='medium' color={isIngredient ? undefined : 'gray.400'}>
                        Register recipe as ingredient
                    </Text>
                </HStack>
                {isIngredient && (
                    <Input
                        placeholder='Plural title'
                        css={{ '& ::placeholder': { color: 'gray.400' } }}
                        fontWeight='medium'
                        value={pluralTitle ?? ''}
                        onChange={(e) => setPluralTitle(e.target.value)}
                        variant='flushed'
                        aria-label='Edit recipe plural title'
                    />
                )}
            </VStack>
        </motion.div>
    );
}
