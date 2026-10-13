import { Modifier } from '@apollo/client/cache';
import { Reference, useMutation } from '@apollo/client';

import { useErrorToast } from '@recipe/common/hooks';
import { UNIT_FIELDS } from '@recipe/graphql/queries/unit';
import { CREATE_UNIT } from '@recipe/graphql/mutations/unit';
import { CreateUnitMutation } from '@recipe/graphql/generated';

import { BaseUnitForm, BaseUnitFormProps, formatUnitError } from './BaseUnitForm';

interface Props extends Omit<BaseUnitFormProps, 'submitForm' | 'initData'> {
    handleComplete: (data: CreateUnitMutation) => void;
}

export function CreateUnitForm(props: Props) {
    const { handleComplete, ...rest } = props;
    const toast = useErrorToast();

    const [createUnit] = useMutation(CREATE_UNIT, {
        onCompleted: handleComplete,
        onError: (error) => {
            toast({
                title: 'Error creating unit',
                description: formatUnitError(error),
                position: 'top',
            });
        },
        update: (cache, { data }) => {
            if (data?.unitCreateOne?.record) {
                const addRecord: Modifier<readonly Reference[]> = (
                    existingRefs = [],
                    { readField }
                ) => {
                    const record = data.unitCreateOne!.record!;
                    const newRef = cache.writeFragment({
                        data: record,
                        fragment: UNIT_FIELDS,
                        fragmentName: 'UnitFields',
                    });
                    if (
                        existingRefs.some((ref: Reference) => readField('_id', ref) === record._id)
                    ) {
                        return existingRefs;
                    }
                    return [...existingRefs, newRef];
                };
                // The creator owns the new unit, so it also belongs in the editable list.
                cache.modify<Record<'unitMany' | 'unitManyEditable', Reference[]>>({
                    fields: { unitMany: addRecord, unitManyEditable: addRecord },
                });
            }
        },
    });

    const handleSubmit = (formData: ModifyableUnit) => {
        createUnit({ variables: { record: formData } });
    };

    return <BaseUnitForm {...rest} initData={{ hasSpace: true }} submitForm={handleSubmit} />;
}
