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
    return (
        <BasePopover
            {...props}
            title='Unit'
            FormComponent={CreateUnitForm}
            extractRecord={(data: CreateUnitMutation) => data.unitCreateOne!.record!}
            extractDescription={(record: UnitChoice) => record.longSingular}
        />
    );
}
