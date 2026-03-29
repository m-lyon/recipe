import { useState } from 'react';
import { useQuery } from '@apollo/client';
import { Box, Stack, Title } from '@mantine/core';

import { useSuccessToast } from '@recipe/common/hooks';
import { SearchableSelect } from '@recipe/common/components';
import { ModifyKeyPhraseForm } from '@recipe/features/keyPhrase';
import { GET_KEY_PHRASES } from '@recipe/graphql/queries/keyPhrase';

export function EditKeyPhrase() {
    const toast = useSuccessToast();
    const [currentKeyPhrase, setCurrentKeyPhrase] =
        useState<ModifyableKeyPhrase & { _id: string }>();
    const { data } = useQuery(GET_KEY_PHRASES);

    return (
        <Stack>
            <Box maw='32em' mx='auto' mt={32} p={8} style={{ border: '1px solid', borderRadius: 8 }}>
                <Title pb={6}>Edit Key Phrase</Title>
                <SearchableSelect
                    label='Select key phrase'
                    aria-label='Select key phrase'
                    options={(data?.keyPhraseMany ?? []).map((kp) => ({
                        value: kp._id,
                        label: kp.value,
                    }))}
                    value={currentKeyPhrase?._id ?? null}
                    onChange={(id) =>
                        setCurrentKeyPhrase(
                            data?.keyPhraseMany.find((kp) => kp._id === id)
                        )
                    }
                />
                <ModifyKeyPhraseForm
                    keyPhraseId={currentKeyPhrase?._id}
                    initData={currentKeyPhrase}
                    disabled={!currentKeyPhrase}
                    handleComplete={() => {
                        toast({
                            title: 'Key phrase saved',
                            position: 'top',
                        });
                    }}
                    onDelete={() => {
                        toast({ title: 'Key phrase deleted', position: 'top' });
                        setCurrentKeyPhrase(undefined);
                    }}
                />
            </Box>
        </Stack>
    );
}
