import { useNavigate } from 'react-router-dom';
import { Box, Heading, VStack } from '@chakra-ui/react';

import { useSuccessToast } from '@recipe/common/hooks';
import { DELAY_LONG, ROOT_PATH } from '@recipe/constants';
import { PrepMethodForm } from '@recipe/features/recipeIngredient';
import { CreatePrepMethodMutation } from '@recipe/graphql/generated';
import { CREATE_PREP_METHOD } from '@recipe/graphql/mutations/prepMethod';

export function CreatePrepMethod() {
    const toast = useSuccessToast();
    const navigate = useNavigate();
    const handleComplete = (data: CreatePrepMethodMutation) => {
        toast({
            title: 'Prep method saved',
            description: `${data?.prepMethodCreateOne?.record?.value} saved, redirecting to the home page.`,
            position: 'top',
        });
        return setTimeout(() => navigate(ROOT_PATH), DELAY_LONG);
    };

    return (
        <VStack>
            <Box maxW='32em' mx='auto' mt={32} borderWidth='1px' borderRadius='lg' p={8}>
                <Heading pb={6}>Create Prep Method</Heading>
                <form>
                    <VStack mt={0} spacing={8}>
                        <PrepMethodForm
                            mutation={CREATE_PREP_METHOD}
                            handleComplete={handleComplete}
                        />
                    </VStack>
                </form>
            </Box>
        </VStack>
    );
}
