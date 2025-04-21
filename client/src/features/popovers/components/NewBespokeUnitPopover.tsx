import { MutableRefObject } from 'react';
import { Popover } from '@chakra-ui/react';
import { CloseButton } from '@chakra-ui/react';

import { CreateUnitMutation } from '@recipe/graphql/generated';
import { CreateBespokeUnitForm } from '@recipe/features/forms';

interface Props {
    fieldRef: MutableRefObject<HTMLInputElement | null>;
    value: string;
    setValue: (value: string) => void;
    onClose: () => void;
    setItem: (item: UnitChoice) => void;
}
export function NewBespokeUnitPopover(props: Props) {
    const { fieldRef, value, setValue, onClose, setItem } = props;

    const handleComplete = (data: CreateUnitMutation) => {
        onClose();
        setItem(data.unitCreateOne!.record!);
    };
    return (
        <Popover.Content paddingRight={4} paddingBottom={3} paddingLeft={2}>
            <Popover.Arrow />
            <CloseButton aria-label='Close new bespoke unit form' />
            <Popover.Header border='hidden'>Use bespoke unit</Popover.Header>
            <CreateBespokeUnitForm
                fieldRef={fieldRef}
                value={value}
                setValue={setValue}
                handleComplete={handleComplete}
                pl={2}
            />
        </Popover.Content>
    );
}
