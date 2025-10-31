import { useNavigate } from 'react-router-dom';
import { Box, Heading, VStack } from '@chakra-ui/react';

import { DELAY_LONG, PATH } from '@recipe/constants';
import { useSuccessToast } from '@recipe/common/hooks';
import { CreateUnitForm } from '@recipe/features/forms';
import { CreateUnitMutation } from '@recipe/graphql/generated';

export function CreateUnit() {
    const toast = useSuccessToast();
    const navigate = useNavigate();
    const handleComplete = (data: CreateUnitMutation) => {
        toast({
            title: 'Unit saved',
            description: `${data!.unitCreateOne!.record!.longSingular} saved, redirecting to the home page.`,
            position: 'top',
        });
        return setTimeout(() => navigate(PATH.ROOT), DELAY_LONG);
    };

    return (
        <VStack>
            <Box maxW='32em' mx='auto' mt={32} borderWidth='1px' borderRadius='lg' p={8}>
                <Heading pb={6}>Create Unit</Heading>
                <form>
                    <VStack mt={0} gap={8}>
                        <CreateUnitForm handleComplete={handleComplete} />
                    </VStack>
                </form>
            </Box>
        </VStack>
    );
}
