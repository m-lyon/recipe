import { Reference, useMutation } from '@apollo/client';

import { useErrorToast } from '@recipe/common/hooks';
import { SIZE_FIELDS } from '@recipe/graphql/queries/size';
import { CREATE_SIZE } from '@recipe/graphql/mutations/size';
import { CreateSizeMutation } from '@recipe/graphql/generated';

import { BaseSizeForm, BaseSizeFormProps, formatSizeError } from './BaseSizeForm';

interface Props extends Omit<BaseSizeFormProps, 'onSubmit'> {
    handleComplete: (data: CreateSizeMutation) => void;
}

export function CreateSizeForm(props: Props) {
    const { handleComplete, ...rest } = props;
    const toast = useErrorToast();

    const [createSize] = useMutation(CREATE_SIZE, {
        onCompleted: handleComplete,
        onError: (error) => {
            toast({
                title: 'Error creating size',
                description: formatSizeError(error),
                position: 'top',
            });
        },
        update: (cache, { data }) => {
            if (data?.sizeCreateOne?.record) {
                cache.modify({
                    fields: {
                        sizeMany(existingRefs = [], { readField }) {
                            const record = data.sizeCreateOne!.record!;
                            const newRef = cache.writeFragment({
                                data: record,
                                fragment: SIZE_FIELDS,
                                fragmentName: 'SizeFields',
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

    const handleSubmit = (formData: ModifyableSize) => {
        createSize({ variables: { record: formData } });
    };

    return <BaseSizeForm {...rest} onSubmit={handleSubmit} />;
}
