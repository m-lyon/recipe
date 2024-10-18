import { useMutation } from '@apollo/client';

import { useErrorToast } from '@recipe/common/hooks';
import { ModifyPrepMethodMutation } from '@recipe/graphql/generated';
import { PREP_METHOD_FIELDS } from '@recipe/graphql/queries/prepMethod';
import { DELETE_PREP_METHOD, MODIFY_PREP_METHOD } from '@recipe/graphql/mutations/prepMethod';

import { formatPrepMethodError } from './BasePrepMethodForm';
import { BasePrepMethodForm, BasePrepMethodFormProps } from './BasePrepMethodForm';

interface Props extends Omit<BasePrepMethodFormProps, 'submitForm'> {
    handleComplete: (data: ModifyPrepMethodMutation) => void;
    onDelete: () => void;
    prepMethodId?: string;
}

export function ModifyPrepMethodForm(props: Props) {
    const { handleComplete, onDelete, prepMethodId, ...rest } = props;
    const toast = useErrorToast();

    const [modifyPrepMethod] = useMutation(MODIFY_PREP_METHOD, {
        onCompleted: handleComplete,
        onError: (error) => {
            toast({
                title: 'Error modifying prep method',
                description: formatPrepMethodError(error),
                position: 'top',
            });
        },
        update: (cache, { data }) => {
            if (data?.prepMethodUpdateById?.record) {
                cache.writeFragment({
                    id: `PrepMethod:${data.prepMethodUpdateById.record._id}`,
                    fragment: PREP_METHOD_FIELDS,
                    fragmentName: 'PrepMethodFields',
                    data: data.prepMethodUpdateById.record,
                });
            }
        },
    });

    const [deletePrepMethod] = useMutation(DELETE_PREP_METHOD, {
        onCompleted: onDelete,
        onError: (error) => {
            toast({
                title: 'Error deleting prep method',
                description: formatPrepMethodError(error),
                position: 'top',
            });
        },
        update: (cache, { data }) => {
            cache.evict({ id: `PrepMethod:${data?.prepMethodRemoveById?.recordId}` });
        },
    });

    const handleSubmit = (formData: ModifyablePrepMethod) => {
        if (prepMethodId) {
            modifyPrepMethod({ variables: { record: formData, id: prepMethodId } });
        }
    };

    const handleDelete = () => {
        if (prepMethodId) {
            deletePrepMethod({ variables: { id: prepMethodId } });
        }
    };

    return <BasePrepMethodForm {...rest} submitForm={handleSubmit} onDelete={handleDelete} />;
}
