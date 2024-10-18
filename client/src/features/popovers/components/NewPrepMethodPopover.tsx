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
    return (
        <BasePopover
            {...props}
            title='Prep method'
            FormComponent={CreatePrepMethodForm}
            extractRecord={(data: CreatePrepMethodMutation) => data.prepMethodCreateOne!.record!}
            extractDescription={(record: PrepMethodChoice) => record.value}
        />
    );
}
