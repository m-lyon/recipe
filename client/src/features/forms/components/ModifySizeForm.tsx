import { useMutation } from '@apollo/client';

import { useErrorToast } from '@recipe/common/hooks';
import { SIZE_FIELDS } from '@recipe/graphql/queries/size';
import { ModifySizeMutation } from '@recipe/graphql/generated';
import { DELETE_SIZE, MODIFY_SIZE } from '@recipe/graphql/mutations/size';

import { BaseSizeForm, BaseSizeFormProps, formatSizeError } from './BaseSizeForm';

interface Props extends Omit<BaseSizeFormProps, 'handleSubmit'> {
    handleComplete: (data: ModifySizeMutation) => void;
    onDelete: () => void;
    sizeId?: string;
}

export function ModifySizeForm(props: Props) {
    const { handleComplete, onDelete, sizeId, ...rest } = props;
    const toast = useErrorToast();

    const [modifySize] = useMutation(MODIFY_SIZE, {
        onCompleted: handleComplete,
        onError: (error) => {
            toast({
                title: 'Error modifying size',
                description: formatSizeError(error),
                position: 'top',
            });
        },
        update: (cache, { data }) => {
            if (data?.sizeUpdateById?.record) {
                cache.writeFragment({
                    id: `Size:${data.sizeUpdateById.record._id}`,
                    fragment: SIZE_FIELDS,
                    fragmentName: 'SizeFields',
                    data: data.sizeUpdateById.record,
                });
            }
        },
    });

    const [deleteSize] = useMutation(DELETE_SIZE, {
        onCompleted: onDelete,
        onError: (error) => {
            toast({
                title: 'Error deleting size',
                description: formatSizeError(error),
                position: 'top',
            });
        },
        update: (cache, { data }) => {
            cache.evict({ id: `Size:${data?.sizeRemoveById?.recordId}` });
        },
    });

    const handleSubmit = (formData: ModifyableSize) => {
        if (sizeId) {
            modifySize({ variables: { record: formData, id: sizeId } });
        }
    };

    const handleDelete = () => {
        if (sizeId) {
            deleteSize({ variables: { id: sizeId } });
        }
    };

    return <BaseSizeForm {...rest} onSubmit={handleSubmit} onDelete={handleDelete} />;
}
