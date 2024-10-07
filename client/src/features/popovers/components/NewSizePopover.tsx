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
    const title = 'Size';
    const extractRecord = (data: CreateSizeMutation) => data.sizeCreateOne!.record!;
    const extractDescription = (record: SizeChoice) => record.value;

    return (
        <BasePopover
            {...props}
            title={title}
            FormComponent={CreateSizeForm}
            extractRecord={extractRecord}
            extractDescription={extractDescription}
        />
    );
}
