import { ReactNode } from 'react';
import { Box, Flex, Spacer, VStack } from '@chakra-ui/react';

interface Props {
    Servings: ReactNode;
    StarRating: ReactNode;
    IngredientList: ReactNode;
    Notes: ReactNode;
    Tags?: ReactNode;
}
export function IngredientsTabLayout(props: Props) {
    const { Servings, StarRating, IngredientList, Notes, Tags } = props;

    return (
        <Flex direction='column' justifyContent='space-between' height='100%'>
            <VStack spacing='24px' align='left'>
                {Tags}
                <Flex paddingBottom={3}>
                    {Servings}
                    <Spacer />
                    {StarRating}
                </Flex>
                {IngredientList}
            </VStack>
            <Spacer />
            <Box height='4em' />
            {Notes}
        </Flex>
    );
}
