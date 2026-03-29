import { useState } from 'react';
import { Button, Group, Modal, Text } from '@mantine/core';
import { useLazyQuery, useMutation } from '@apollo/client';

import { useErrorToast } from '@recipe/common/hooks';
import { UpdateKeyPhraseMutation } from '@recipe/graphql/generated';
import { KEY_PHRASE_FIELDS } from '@recipe/graphql/queries/keyPhrase';
import { KEY_PHRASE_USED_IN_RECIPES } from '@recipe/graphql/queries/keyPhrase';
import { UPDATE_KEY_PHRASE, REMOVE_KEY_PHRASE } from '@recipe/graphql/mutations/keyPhrase';

import { formatKeyPhraseError } from './BaseKeyPhraseForm';
import { BaseKeyPhraseForm, BaseKeyPhraseFormProps } from './BaseKeyPhraseForm';

interface Props extends Omit<BaseKeyPhraseFormProps, 'submitForm'> {
    handleComplete: (data: UpdateKeyPhraseMutation) => void;
    onDelete: () => void;
    keyPhraseId?: string;
}

export function ModifyKeyPhraseForm(props: Props) {
    const { handleComplete, onDelete, keyPhraseId, ...rest } = props;
    const toast = useErrorToast();
    const [deleteModalOpened, setDeleteModalOpened] = useState(false);
    const [usedInRecipes, setUsedInRecipes] = useState(false);

    const [checkUsedInRecipes] = useLazyQuery(KEY_PHRASE_USED_IN_RECIPES);

    const [updateKeyPhrase] = useMutation(UPDATE_KEY_PHRASE, {
        onCompleted: handleComplete,
        onError: (error) => {
            toast({
                title: 'Error modifying key phrase',
                description: formatKeyPhraseError(error),
                position: 'top',
            });
        },
        update: (cache, { data }) => {
            if (data?.keyPhraseUpdateById?.record) {
                cache.writeFragment({
                    id: `KeyPhrase:${data.keyPhraseUpdateById.record._id}`,
                    fragment: KEY_PHRASE_FIELDS,
                    fragmentName: 'KeyPhraseFields',
                    data: data.keyPhraseUpdateById.record,
                });
            }
        },
    });

    const [removeKeyPhrase] = useMutation(REMOVE_KEY_PHRASE, {
        onCompleted: () => {
            setDeleteModalOpened(false);
            onDelete();
        },
        onError: (error) => {
            toast({
                title: 'Error deleting key phrase',
                description: formatKeyPhraseError(error),
                position: 'top',
            });
        },
        update: (cache, { data }) => {
            if (data?.keyPhraseRemoveById?.record) {
                cache.evict({ id: `KeyPhrase:${data.keyPhraseRemoveById.record._id}` });
            }
        },
    });

    const handleSubmit = (formData: ModifyableKeyPhrase) => {
        if (keyPhraseId) {
            updateKeyPhrase({ variables: { _id: keyPhraseId, record: formData } });
        }
    };

    const handleDeleteClick = async () => {
        if (keyPhraseId && rest.initData?.value) {
            const { data, error } = await checkUsedInRecipes({
                variables: { value: rest.initData.value },
            });
            if (error) {
                toast({
                    title: 'Error checking usage',
                    description: error.message,
                    position: 'top',
                });
                return;
            }
            setUsedInRecipes(data?.keyPhraseUsedInRecipes ?? false);
            setDeleteModalOpened(true);
        }
    };

    const confirmDelete = () => {
        if (keyPhraseId) {
            removeKeyPhrase({ variables: { recordId: keyPhraseId } });
        }
    };

    return (
        <>
            <BaseKeyPhraseForm {...rest} submitForm={handleSubmit} onDelete={handleDeleteClick} />
            <Modal
                opened={deleteModalOpened}
                onClose={() => setDeleteModalOpened(false)}
                title='Delete Key Phrase'
            >
                {usedInRecipes ? (
                    <Text>
                        This key phrase is currently used in existing recipes. Are you sure you want
                        to delete it?
                    </Text>
                ) : (
                    <Text>Are you sure you want to delete this key phrase?</Text>
                )}
                <Group justify='flex-end' pt='md'>
                    <Button variant='default' onClick={() => setDeleteModalOpened(false)}>
                        Cancel
                    </Button>
                    <Button color='red' onClick={confirmDelete}>
                        Delete
                    </Button>
                </Group>
            </Modal>
        </>
    );
}
