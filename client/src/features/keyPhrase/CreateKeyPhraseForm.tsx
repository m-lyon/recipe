import { Reference, useMutation } from '@apollo/client';

import { useErrorToast } from '@recipe/common/hooks';
import { CreateKeyPhraseMutation } from '@recipe/graphql/generated';
import { KEY_PHRASE_FIELDS } from '@recipe/graphql/queries/keyPhrase';
import { CREATE_KEY_PHRASE } from '@recipe/graphql/mutations/keyPhrase';

import { formatKeyPhraseError } from './BaseKeyPhraseForm';
import { BaseKeyPhraseForm, BaseKeyPhraseFormProps } from './BaseKeyPhraseForm';

interface Props extends Omit<BaseKeyPhraseFormProps, 'submitForm'> {
    handleComplete: (data: CreateKeyPhraseMutation) => void;
}

export function CreateKeyPhraseForm(props: Props) {
    const { handleComplete, ...rest } = props;
    const toast = useErrorToast();

    const [createKeyPhrase] = useMutation(CREATE_KEY_PHRASE, {
        onCompleted: handleComplete,
        onError: (error) => {
            toast({
                title: 'Error creating key phrase',
                description: formatKeyPhraseError(error),
                position: 'top',
            });
        },
        update: (cache, { data }) => {
            if (data?.keyPhraseCreateOne?.record) {
                cache.modify({
                    fields: {
                        keyPhraseMany(existingRefs = [], { readField }) {
                            const record = data.keyPhraseCreateOne!.record!;
                            const newRef = cache.writeFragment({
                                data: record,
                                fragment: KEY_PHRASE_FIELDS,
                                fragmentName: 'KeyPhraseFields',
                            });
                            if (
                                existingRefs.some(
                                    (ref: Reference) => readField('_id', ref) === record._id
                                )
                            ) {
                                return existingRefs;
                            }
                            return [...existingRefs, newRef];
                        },
                    },
                });
            }
        },
    });

    const handleSubmit = (formData: ModifyableKeyPhrase) => {
        createKeyPhrase({ variables: { record: formData } });
    };

    return <BaseKeyPhraseForm {...rest} submitForm={handleSubmit} />;
}
