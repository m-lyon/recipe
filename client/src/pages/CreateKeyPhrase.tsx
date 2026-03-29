import { useNavigate } from 'react-router-dom';
import { Box, Stack, Title } from '@mantine/core';

import { DELAY_LONG, PATH } from '@recipe/constants';
import { useSuccessToast } from '@recipe/common/hooks';
import { CreateKeyPhraseForm } from '@recipe/features/keyPhrase';
import { CreateKeyPhraseMutation } from '@recipe/graphql/generated';

export function CreateKeyPhrase() {
    const toast = useSuccessToast();
    const navigate = useNavigate();
    const handleComplete = (data: CreateKeyPhraseMutation) => {
        toast({
            title: 'Key phrase saved',
            description: `"${data!.keyPhraseCreateOne!.record!.value}" saved, redirecting to home.`,
            position: 'top',
        });
        return setTimeout(() => navigate(PATH.ROOT), DELAY_LONG);
    };

    return (
        <Stack>
            <Box maw='32em' mx='auto' mt={32} p={8} style={{ border: '1px solid', borderRadius: 8 }}>
                <Title pb={6}>Create Key Phrase</Title>
                <CreateKeyPhraseForm handleComplete={handleComplete} />
            </Box>
        </Stack>
    );
}
