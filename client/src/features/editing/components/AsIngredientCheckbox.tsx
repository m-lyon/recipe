import { motion } from 'framer-motion';
import { Checkbox, HStack, Input, Text, VStack } from '@chakra-ui/react';

import { UseAsIngredientReturnType } from '../hooks/useAsIngredient';

export function AsIngredientCheckbox(props: UseAsIngredientReturnType) {
    const { state, actionHandler } = props;

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
                        isChecked={state.isIngredient}
                        onChange={() => actionHandler.toggleIsIngredient()}
                        colorScheme='teal'
                    />
                    <Text fontWeight='medium' color={state.isIngredient ? undefined : 'gray.400'}>
                        Register recipe as ingredient
                    </Text>
                </HStack>
                {state.isIngredient && (
                    <Input
                        placeholder='Plural title'
                        value={state.pluralTitle}
                        onChange={(e) => actionHandler.setPluralTitle(e.target.value)}
                        variant='unstyled'
                    />
                )}
            </VStack>
        </motion.div>
    );
}
