import { Flex, Spacer, useBreakpointValue } from '@chakra-ui/react';

import { UseItemListReturnType } from '../hooks/useItemList';
import { AsIngredientCheckbox } from './AsIngredientCheckbox';
import { EditableInstructionList } from './EditableInstructionList';
import { UseAsIngredientReturnType } from '../hooks/useAsIngredient';
import { EditableSource, EditableSourceProps } from './EditableSource';

interface Props {
    instructionsProps: UseItemListReturnType;
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
            <EditableInstructionList {...instructionsProps} />
            <Spacer />
            <Flex direction={styles?.flexDirection} justifyContent='space-between'>
                <AsIngredientCheckbox {...asIngredientProps} />
                <EditableSource {...sourceProps} />
            </Flex>
        </Flex>
    );
}
