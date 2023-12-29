import { Flex, VStack, Text, HStack, Spacer } from '@chakra-ui/react';
import { FaStar, FaRegStarHalfStroke, FaRegStar } from 'react-icons/fa6';
import { UseIngredientListReturnType } from '../hooks/useIngredientList';
import { EditableIngredientList } from './EditableIngredientList';
import { UseEditableReturnType } from '../hooks/useEditable';
import { EditableNotes } from './EditableNotes';
import { Servings, ServingsProps } from '../../../components/Servings';

interface Props {
    servingsProps: ServingsProps;
    ingredientsProps: UseIngredientListReturnType;
    notesProps: UseEditableReturnType;
}
export function EditableIngredientsTab(props: Props) {
    const { servingsProps, ingredientsProps, notesProps } = props;
    return (
        <Flex direction={'column'} justifyContent='space-between' height='100%'>
            <VStack spacing='24px' align='left'>
                <Flex paddingBottom={3}>
                    <Servings {...servingsProps} />
                    <Spacer />
                    <HStack spacing={2}>
                        <FaStar />
                        <FaStar />
                        <FaStar />
                        <FaRegStarHalfStroke />
                        <FaRegStar />
                    </HStack>
                </Flex>
                <Flex>
                    <Text fontSize='2xl'>Ingredients</Text>
                </Flex>
                <EditableIngredientList {...ingredientsProps} />
            </VStack>
            <Spacer />
            <EditableNotes {...notesProps} />
        </Flex>
    );
}
