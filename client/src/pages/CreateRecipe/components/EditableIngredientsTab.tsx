import { Flex, VStack, Text, Spacer } from '@chakra-ui/react';
import { UseIngredientListReturnType } from '../hooks/useIngredientList';
import { EditableIngredientList } from './EditableIngredientList';
import { UseEditableReturnType } from '../hooks/useEditable';
import { EditableNotes } from './EditableNotes';
import { Servings, ServingsProps } from '../../../components/Servings';
import { StarRating, StarRatingProps } from '../../../components/StarRating';

interface Props {
    servingsProps: ServingsProps;
    ratingProps: StarRatingProps;
    ingredientsProps: UseIngredientListReturnType;
    notesProps: UseEditableReturnType;
}
export function EditableIngredientsTab(props: Props) {
    const { servingsProps, ratingProps, ingredientsProps, notesProps } = props;
    return (
        <Flex direction={'column'} justifyContent='space-between' height='100%'>
            <VStack spacing='24px' align='left'>
                <Flex paddingBottom={3}>
                    <Servings {...servingsProps} />
                    <Spacer />
                    <StarRating {...ratingProps} />
                </Flex>
                <Flex>
                    <Text fontSize='2xl'>Ingredients</Text>
                    <Spacer />
                </Flex>
                <EditableIngredientList {...ingredientsProps} />
            </VStack>
            <Spacer />
            <EditableNotes {...notesProps} />
        </Flex>
    );
}
