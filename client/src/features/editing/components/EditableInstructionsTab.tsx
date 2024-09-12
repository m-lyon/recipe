import { Flex, Spacer } from '@chakra-ui/react';

import { AsIngredientCheckbox } from './AsIngredientCheckbox';
import { UseAsIngredientReturnType } from '../hooks/useAsIngredient';
import { EditableSource, EditableSourceProps } from './EditableSource';
import { UseInstructionListReturnType } from '../hooks/useInstructionsList';
import { EditableInstructionSubsections } from './EditableInstructionSubsections';

interface Props {
    instructionsProps: UseInstructionListReturnType;
    asIngredientProps: UseAsIngredientReturnType;
    sourceProps: EditableSourceProps;
}
export function EditableInstructionsTab(props: Props) {
    const { instructionsProps, asIngredientProps, sourceProps } = props;

    return (
        <Flex direction='column' justifyContent='space-between' height='100%'>
            <EditableInstructionSubsections {...instructionsProps} />
            <Spacer />
            <Flex direction={{ base: 'column', md: 'row' }} justifyContent='space-between'>
                <AsIngredientCheckbox {...asIngredientProps} />
                <EditableSource {...sourceProps} />
            </Flex>
        </Flex>
    );
}
