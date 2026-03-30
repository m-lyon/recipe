import { Flex, Spacer } from '@chakra-ui/react';

import { EditableSource } from './EditableSource';
import { AsIngredientCheckbox } from './AsIngredientCheckbox';
import { CreateVeganVersionCheckbox } from './CreateVeganVersionCheckbox';
import { EditableInstructionSubsections } from './EditableInstructionSubsections';

interface Props {
    isVeganCopy?: boolean;
}
export function EditableInstructionsTab({ isVeganCopy }: Props) {
    return (
        <Flex direction='column' justifyContent='space-between' height='100%'>
            <EditableInstructionSubsections />
            <Spacer />
            <Flex direction={{ base: 'column', md: 'row' }} justifyContent='space-between'>
                <AsIngredientCheckbox />
                {!isVeganCopy && <CreateVeganVersionCheckbox />}
                <EditableSource />
            </Flex>
        </Flex>
    );
}
