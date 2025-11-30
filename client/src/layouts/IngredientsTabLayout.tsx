import { ReactNode } from 'react';
import { Flex, Spacer, VStack } from '@chakra-ui/react';

interface Props {
    Servings: ReactNode;
    StarRating: ReactNode;
    IngredientList: ReactNode;
    Notes: ReactNode;
    Tags?: ReactNode;
    UsedIn?: ReactNode;
}
export function IngredientsTabLayout(props: Props) {
    const { Servings, StarRating, IngredientList, Notes, Tags, UsedIn } = props;

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
                {UsedIn}
            </VStack>
            <Spacer />
            {Notes}
        </Flex>
    );
}
