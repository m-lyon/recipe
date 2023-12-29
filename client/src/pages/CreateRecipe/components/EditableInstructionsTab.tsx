import { EditableInstructionList } from './EditableInstructionList';
import { UseItemListReturnType } from '../hooks/useItemList';
import { Spacer, Flex } from '@chakra-ui/react';
import { EditableSource, EditableSourceProps } from './EditableSource';

interface Props {
    instructionsProps: UseItemListReturnType;
    sourceProps: EditableSourceProps;
}
export function EditableInstructionsTab(props: Props) {
    const { instructionsProps, sourceProps } = props;
    return (
        <Flex direction={'column'} justifyContent='space-between' height='100%'>
            <EditableInstructionList {...instructionsProps} />
            <Spacer />
            <EditableSource {...sourceProps} />
        </Flex>
    );
}
