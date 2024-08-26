import { Flex, Spacer, useBreakpointValue } from '@chakra-ui/react';

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
    const styles = useBreakpointValue(
        {
            base: {
                flexDirection: 'column' as const,
            },
            md: {
                flexDirection: 'row' as const,
            },
        },
        { fallback: 'md' }
    );
    return (
        <Flex direction='column' justifyContent='space-between' height='100%'>
            <EditableInstructionSubsections {...instructionsProps} />
            <Spacer />
            <Flex direction={styles?.flexDirection} justifyContent='space-between'>
                <AsIngredientCheckbox {...asIngredientProps} />
                <EditableSource {...sourceProps} />
            </Flex>
        </Flex>
    );
}
