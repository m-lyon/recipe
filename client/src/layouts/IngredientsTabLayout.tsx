import { ReactNode } from 'react';
import { Box, Flex, Spacer, Text, VStack, useBreakpointValue } from '@chakra-ui/react';

interface Props {
    Servings: ReactNode;
    StarRating: ReactNode;
    UnitOptions?: ReactNode;
    IngredientList: ReactNode;
    Notes: ReactNode;
    Tags?: ReactNode;
}
export function IngredientsTabLayout(props: Props) {
    const { Servings, StarRating, UnitOptions, IngredientList, Notes, Tags } = props;
    const styles = useBreakpointValue(
        {
            base: { showTags: true },
            md: { showTags: false },
        },
        { fallback: 'md' },
    );
    return (
        <Flex direction='column' justifyContent='space-between' height='100%'>
            <VStack spacing='24px' align='left'>
                {styles?.showTags && Tags}
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
