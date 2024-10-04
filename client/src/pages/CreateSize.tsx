import { useNavigate } from 'react-router-dom';
import { Box, Heading, VStack } from '@chakra-ui/react';

import { useSuccessToast } from '@recipe/common/hooks';
import { DELAY_LONG, ROOT_PATH } from '@recipe/constants';
import { CREATE_SIZE } from '@recipe/graphql/mutations/size';
import { SizeForm } from '@recipe/features/recipeIngredient';
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
        return setTimeout(() => navigate(ROOT_PATH), DELAY_LONG);
    };

    return (
        <VStack>
            <Box maxW='32em' mx='auto' mt={32} borderWidth='1px' borderRadius='lg' p={8}>
                <Heading pb={6}>Create Size</Heading>
                <form>
                    <VStack mt={0} spacing={8}>
                        <SizeForm mutation={CREATE_SIZE} handleComplete={handleComplete} />
                    </VStack>
                </form>
            </Box>
        </VStack>
    );
}
