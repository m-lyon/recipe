import { Box, Flex, Spacer, Text, VStack } from '@chakra-ui/react';

import { ReactNode } from 'react';

interface Props {
    Servings: ReactNode;
    StarRating: ReactNode;
    UnitOptions?: ReactNode;
    IngredientList: ReactNode;
    Notes: ReactNode;
}
export function IngredientsTabLayout(props: Props) {
    const { Servings, StarRating, UnitOptions, IngredientList, Notes } = props;
    return (
        <Flex direction='column' justifyContent='space-between' height='100%'>
            <VStack spacing='24px' align='left'>
                <Flex paddingBottom={3}>
                    {Servings}
                    <Spacer />
                    {StarRating}
                </Flex>
                <Flex>
                    <Text fontSize='2xl'>Ingredients</Text>
                    <Spacer />
                    {UnitOptions}
                </Flex>
                {IngredientList}
            </VStack>
            <Spacer />
            <Box height='4em' />
            {Notes}
        </Flex>
    );
}
