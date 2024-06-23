import { useNavigate } from 'react-router-dom';
import { Box, Heading, VStack, useToast } from '@chakra-ui/react';

import { DELAY_LONG, ROOT_PATH } from '@recipe/constants';
import { IngredientForm } from '@recipe/features/recipeIngredient';
import { CreateIngredientMutation } from '@recipe/graphql/generated';
import { CREATE_INGREDIENT } from '@recipe/graphql/mutations/ingredient';

export function CreateIngredient() {
    const toast = useToast();
    const navigate = useNavigate();
    const handleComplete = (data: CreateIngredientMutation) => {
        toast({
            title: 'Ingredient saved',
            description: `${data?.ingredientCreateOne?.record?.name} saved, redirecting to the home page.`,
            status: 'success',
            position: 'top',
            duration: DELAY_LONG,
        });
        return setTimeout(() => navigate(ROOT_PATH), DELAY_LONG);
    };

    return (
        <VStack>
            <Box maxW='32em' mx='auto' mt={32} borderWidth='1px' borderRadius='lg' p={8}>
                <Heading pb={6}>Create Ingredient</Heading>
                <form>
                    <VStack mt={0} spacing={8}>
                        <IngredientForm
                            mutation={CREATE_INGREDIENT}
                            handleComplete={handleComplete}
                        />
                    </VStack>
                </form>
            </Box>
        </VStack>
    );
}
