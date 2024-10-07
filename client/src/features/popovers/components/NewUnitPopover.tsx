import { MutableRefObject } from 'react';

import { CreateUnitForm } from '@recipe/features/forms';
import { CreateUnitMutation } from '@recipe/graphql/generated';

import { BasePopover } from './BasePopover';

interface Props {
    fieldRef: MutableRefObject<HTMLInputElement | null>;
    onClose: () => void;
    setItem: (item: UnitChoice) => void;
}
export function NewUnitPopover(props: Props) {
    const title = 'Unit';
    const extractRecord = (data: CreateUnitMutation) => data.unitCreateOne!.record!;
    const extractDescription = (record: UnitChoice) => record.longSingular;

    return (
        <BasePopover
            {...props}
            title={title}
            FormComponent={CreateUnitForm}
            extractRecord={extractRecord}
            extractDescription={extractDescription}
        />
    );
}
