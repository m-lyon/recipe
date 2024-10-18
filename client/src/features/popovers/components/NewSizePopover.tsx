import { MutableRefObject } from 'react';

import { CreateSizeForm } from '@recipe/features/forms';
import { CreateSizeMutation } from '@recipe/graphql/generated';

import { BasePopover } from './BasePopover';

interface Props {
    fieldRef: MutableRefObject<HTMLInputElement | null>;
    onClose: () => void;
    setItem: (item: SizeChoice) => void;
}
export function NewSizePopover(props: Props) {
    return (
        <BasePopover
            {...props}
            title='Size'
            FormComponent={CreateSizeForm}
            extractRecord={(data: CreateSizeMutation) => data.sizeCreateOne!.record!}
            extractDescription={(record: SizeChoice) => record.value}
        />
    );
}
