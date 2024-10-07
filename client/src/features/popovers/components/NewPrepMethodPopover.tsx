import { MutableRefObject } from 'react';

import { CreatePrepMethodForm } from '@recipe/features/forms';
import { CreatePrepMethodMutation } from '@recipe/graphql/generated';

import { BasePopover } from './BasePopover';

interface Props {
    fieldRef: MutableRefObject<HTMLInputElement | null>;
    onClose: () => void;
    setItem: (item: PrepMethodChoice) => void;
}

export function NewPrepMethodPopover(props: Props) {
    const title = 'Prep method';
    const extractRecord = (data: CreatePrepMethodMutation) => data.prepMethodCreateOne!.record!;
    const extractDescription = (record: PrepMethodChoice) => record.value;

    return (
        <BasePopover
            {...props}
            title={title}
            FormComponent={CreatePrepMethodForm}
            extractRecord={extractRecord}
            extractDescription={extractDescription}
        />
    );
}
