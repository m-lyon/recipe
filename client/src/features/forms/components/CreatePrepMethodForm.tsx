import { Modifier } from '@apollo/client/cache';
import { Reference, useMutation } from '@apollo/client';

import { useErrorToast } from '@recipe/common/hooks';
import { CreatePrepMethodMutation } from '@recipe/graphql/generated';
import { PREP_METHOD_FIELDS } from '@recipe/graphql/queries/prepMethod';
import { CREATE_PREP_METHOD } from '@recipe/graphql/mutations/prepMethod';

import { formatPrepMethodError } from './BasePrepMethodForm';
import { BasePrepMethodForm, BasePrepMethodFormProps } from './BasePrepMethodForm';

interface Props extends Omit<BasePrepMethodFormProps, 'submitForm'> {
    handleComplete: (data: CreatePrepMethodMutation) => void;
}

export function CreatePrepMethodForm(props: Props) {
    const { handleComplete, ...rest } = props;
    const toast = useErrorToast();

    const [createPrepMethod] = useMutation(CREATE_PREP_METHOD, {
        onCompleted: handleComplete,
        onError: (error) => {
            toast({
                title: 'Error creating prep method',
                description: formatPrepMethodError(error),
                position: 'top',
            });
        },
        update: (cache, { data }) => {
            if (data?.prepMethodCreateOne?.record) {
                const addRecord: Modifier<readonly Reference[]> = (
                    existingRefs = [],
                    { readField }
                ) => {
                    const record = data.prepMethodCreateOne!.record!;
                    const newRef = cache.writeFragment({
                        data: record,
                        fragment: PREP_METHOD_FIELDS,
                        fragmentName: 'PrepMethodFields',
                    });
                    if (
                        existingRefs.some((ref: Reference) => readField('_id', ref) === record._id)
                    ) {
                        return existingRefs;
                    }
                    return [...existingRefs, newRef];
                };
                // The creator owns the new prep method, so it also belongs in the editable list.
                cache.modify<Record<'prepMethodMany' | 'prepMethodManyEditable', Reference[]>>({
                    fields: { prepMethodMany: addRecord, prepMethodManyEditable: addRecord },
                });
            }
        },
    });

    const handleSubmit = (formData: ModifyablePrepMethod) => {
        createPrepMethod({ variables: { record: formData } });
    };

    return <BasePrepMethodForm {...rest} submitForm={handleSubmit} />;
}
