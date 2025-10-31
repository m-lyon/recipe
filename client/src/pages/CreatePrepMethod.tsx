import { useNavigate } from 'react-router-dom';
import { Box, Heading, VStack } from '@chakra-ui/react';

import { DELAY_LONG, PATH } from '@recipe/constants';
import { useSuccessToast } from '@recipe/common/hooks';
import { CreatePrepMethodForm } from '@recipe/features/forms';
import { CreatePrepMethodMutation } from '@recipe/graphql/generated';

export function CreatePrepMethod() {
    const toast = useSuccessToast();
    const navigate = useNavigate();
    const handleComplete = (data: CreatePrepMethodMutation) => {
        toast({
            title: 'Prep method saved',
            description: `${data!.prepMethodCreateOne!.record!.value} saved, redirecting to the home page.`,
            position: 'top',
        });
        return setTimeout(() => navigate(PATH.ROOT), DELAY_LONG);
    };

    return (
        <VStack>
            <Box maxW='32em' mx='auto' mt={32} borderWidth='1px' borderRadius='lg' p={8}>
                <Heading pb={6}>Create Prep Method</Heading>
                <form>
                    <VStack mt={0} gap={8}>
                        <CreatePrepMethodForm handleComplete={handleComplete} />
                    </VStack>
                </form>
            </Box>
        </VStack>
    );
}
