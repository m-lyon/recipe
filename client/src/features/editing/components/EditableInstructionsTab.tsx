import { Box, Flex, Spacer } from '@chakra-ui/react';

import { EditableSource } from './EditableSource';
import { AsIngredientCheckbox } from './AsIngredientCheckbox';
import { CreateVeganVersionCheckbox } from './CreateVeganVersionCheckbox';
import { EditableInstructionSubsections } from './EditableInstructionSubsections';

interface Props {
    showVeganCheckbox?: boolean;
    veganVersion?: { _id: string; title: string; titleIdentifier: string } | null;
}
export function EditableInstructionsTab({ showVeganCheckbox, veganVersion }: Props) {
    return (
        <Flex direction='column' justifyContent='space-between' height='100%'>
            <EditableInstructionSubsections />
            <Spacer />
            <Flex direction={{ base: 'column', md: 'row' }} justifyContent='space-between'>
                <AsIngredientCheckbox />
                {showVeganCheckbox && (
                    <Box width='100%' display='flex' justifyContent='center' alignItems='flex-end'>
                        <CreateVeganVersionCheckbox veganVersion={veganVersion} />
                    </Box>
                )}
                <EditableSource />
            </Flex>
        </Flex>
    );
}
