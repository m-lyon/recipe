import { ReactNode } from 'react';
import { Flex, Spacer, VStack } from '@chakra-ui/react';

interface Props {
    Servings: ReactNode;
    StarRating: ReactNode;
    IngredientList: ReactNode;
    Notes: ReactNode;
    Tags?: ReactNode;
    Yield?: ReactNode;
    UsedIn?: ReactNode;
}
export function IngredientsTabLayout(props: Props) {
    const { Servings, StarRating, IngredientList, Notes, Tags, Yield, UsedIn } = props;

    return (
        <Flex direction='column' justifyContent='space-between' height='100%'>
            <VStack spacing='24px' align='left'>
                {Tags}
                <VStack spacing={2} align='stretch' paddingBottom={3}>
                    <Flex>
                        {Servings}
                        <Spacer />
                        {StarRating}
                    </Flex>
                    {Yield}
                </VStack>
                {IngredientList}
            </VStack>
            <Spacer minH='20px' />
            <VStack spacing='24px' align='left'>
                {UsedIn}
                {Notes}
            </VStack>
        </Flex>
    );
}
