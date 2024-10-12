import { useNavigate } from 'react-router-dom';
import { Box, Heading, VStack } from '@chakra-ui/react';

import { DELAY_LONG, PATH } from '@recipe/constants';
import { useSuccessToast } from '@recipe/common/hooks';
import { CreateSizeForm } from '@recipe/features/forms';
import { CreateSizeMutation } from '@recipe/graphql/generated';

export function CreateSize() {
    const toast = useSuccessToast();
    const navigate = useNavigate();
    const handleComplete = (data: CreateSizeMutation) => {
        toast({
            title: 'Size saved',
            description: `${data!.sizeCreateOne!.record!.value} saved, redirecting to the home page.`,
            position: 'top',
        });
        return setTimeout(() => navigate(PATH.ROOT), DELAY_LONG);
    };

    return (
        <VStack>
            <Box maxW='32em' mx='auto' mt={32} borderWidth='1px' borderRadius='lg' p={8}>
                <Heading pb={6}>Create Size</Heading>
                <form>
                    <VStack mt={0} spacing={8}>
                        <CreateSizeForm handleComplete={handleComplete} />
                    </VStack>
                </form>
            </Box>
        </VStack>
    );
}
