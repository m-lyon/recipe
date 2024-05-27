import { useNavigate } from 'react-router-dom';
import { Box, Heading, VStack, useToast } from '@chakra-ui/react';

import { ROOT_PATH } from '@recipe/constants';
import { CREATE_UNIT } from '@recipe/graphql/mutations/unit';
import { UnitForm } from '@recipe/features/recipeIngredient';
import { CreateUnitMutation } from '@recipe/graphql/generated';

export function CreateUnit() {
    const toast = useToast();
    const navigate = useNavigate();
    const handleComplete = (data: CreateUnitMutation) => {
        toast({
            title: 'Unit saved',
            description: `${data?.unitCreateOne?.record?.longSingular} saved, redirecting to the home page.`,
            status: 'success',
            position: 'top',
            duration: 3000,
        });
        return setTimeout(() => navigate(ROOT_PATH), 3000);
    };

    return (
        <VStack>
            <Box maxW='32em' mx='auto' mt={32} borderWidth='1px' borderRadius='lg' p={8}>
                <Heading pb={6}>Create Unit</Heading>
                <form>
                    <VStack mt={0} spacing={8}>
                        <UnitForm mutation={CREATE_UNIT} handleComplete={handleComplete} />
                    </VStack>
                </form>
            </Box>
        </VStack>
    );
}
