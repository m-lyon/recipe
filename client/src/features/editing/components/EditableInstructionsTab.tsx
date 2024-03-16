import { EditableInstructionList } from './EditableInstructionList';
import { UseItemListReturnType } from '../hooks/useItemList';
import { Spacer, Flex } from '@chakra-ui/react';
import { EditableSource, EditableSourceProps } from './EditableSource';
import { UseAsIngredientReturnType } from '../hooks/useAsIngredient';
import { AsIngredientCheckbox } from './AsIngredientCheckbox';

interface Props {
    instructionsProps: UseItemListReturnType;
    asIngredientProps: UseAsIngredientReturnType;
    sourceProps: EditableSourceProps;
}
export function EditableInstructionsTab(props: Props) {
    const { instructionsProps, asIngredientProps, sourceProps } = props;
    return (
        <Flex direction='column' justifyContent='space-between' height='100%'>
            <EditableInstructionList {...instructionsProps} />
            <Spacer />
            <Flex direction='row' justifyContent='space-between'>
                <AsIngredientCheckbox {...asIngredientProps} />
                <EditableSource {...sourceProps} />
            </Flex>
        </Flex>
    );
}
