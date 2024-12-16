import { Flex, Spacer } from '@chakra-ui/react';

import { EditableSource } from './EditableSource';
import { AsIngredientCheckbox } from './AsIngredientCheckbox';
import { EditableInstructionSubsections } from './EditableInstructionSubsections';

export function EditableInstructionsTab() {
    return (
        <Flex direction='column' justifyContent='space-between' height='100%'>
            <EditableInstructionSubsections />
            <Spacer />
            <Flex direction={{ base: 'column', md: 'row' }} justifyContent='space-between'>
                <AsIngredientCheckbox />
                <EditableSource />
            </Flex>
        </Flex>
    );
}
