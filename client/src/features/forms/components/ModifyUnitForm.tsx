import { useMutation } from '@apollo/client';

import { useErrorToast } from '@recipe/common/hooks';
import { UNIT_FIELDS } from '@recipe/graphql/queries/unit';
import { ModifyUnitMutation } from '@recipe/graphql/generated';
import { DELETE_UNIT, MODIFY_UNIT } from '@recipe/graphql/mutations/unit';

import { BaseUnitForm, BaseUnitFormProps, UnitFormData, formatUnitError } from './BaseUnitForm';

interface Props extends Omit<BaseUnitFormProps, 'handleSubmit'> {
    handleComplete: (data: ModifyUnitMutation) => void;
    handleDelete: () => void;
    unitId?: string;
}

export function ModifyUnitForm(props: Props) {
    const { handleComplete, handleDelete, unitId, ...rest } = props;
    const toast = useErrorToast();

    const [modifyUnit] = useMutation(MODIFY_UNIT, {
        onCompleted: handleComplete,
        onError: (error) => {
            toast({
                title: 'Error modifying unit',
                description: formatUnitError(error),
                position: 'top',
            });
        },
        update: (cache, { data }) => {
            if (data?.unitUpdateById?.record) {
                cache.writeFragment({
                    id: `Unit:${data.unitUpdateById.record._id}`,
                    fragment: UNIT_FIELDS,
                    fragmentName: 'UnitFields',
                    data: data.unitUpdateById.record,
                });
            }
        },
    });

    const [deleteUnit] = useMutation(DELETE_UNIT, {
        onCompleted: handleDelete,
        onError: (error) => {
            toast({
                title: 'Error deleting unit',
                description: formatUnitError(error),
                position: 'top',
            });
        },
        update: (cache, { data }) => {
            cache.evict({ id: `Unit:${data?.unitRemoveById?.recordId}` });
        },
    });

    const handleSubmit = (formData: UnitFormData) => {
        if (unitId) {
            modifyUnit({ variables: { record: formData, id: unitId } });
        }
    };

    const onDelete = () => {
        if (unitId) {
            deleteUnit({ variables: { id: unitId } });
        }
    };

    return <BaseUnitForm {...rest} handleSubmit={handleSubmit} handleDelete={onDelete} />;
}
