import { Flex, Spacer } from '@chakra-ui/react';

import { EditableSource } from './EditableSource';
import { AsIngredientCheckbox } from './AsIngredientCheckbox';
import { UseInstructionListReturnType } from '../hooks/useInstructionsList';
import { EditableInstructionSubsections } from './EditableInstructionSubsections';

interface Props {
    instructionsProps: UseInstructionListReturnType;
}
export function EditableInstructionsTab(props: Props) {
    const { instructionsProps } = props;

    return (
        <Flex direction='column' justifyContent='space-between' height='100%'>
            <EditableInstructionSubsections {...instructionsProps} />
            <Spacer />
            <Flex direction={{ base: 'column', md: 'row' }} justifyContent='space-between'>
                <AsIngredientCheckbox />
                <EditableSource />
            </Flex>
        </Flex>
    );
}
