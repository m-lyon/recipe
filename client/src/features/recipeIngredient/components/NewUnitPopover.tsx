import { MutableRefObject } from 'react';
import { PopoverArrow, PopoverHeader } from '@chakra-ui/react';
import { PopoverCloseButton, PopoverContent } from '@chakra-ui/react';

import { useSuccessToast } from '@recipe/common/hooks';
import { CreateUnitForm } from '@recipe/features/forms';
import { CreateUnitMutation } from '@recipe/graphql/generated';

interface Props {
    fieldRef: MutableRefObject<HTMLInputElement | null>;
    onClose: () => void;
    setItem: (item: UnitChoice) => void;
}
export function NewUnitPopover(props: Props) {
    const { fieldRef, onClose, setItem } = props;
    const toast = useSuccessToast();

    const handleComplete = (data: CreateUnitMutation) => {
        onClose();
        // handleComplete is called when the mutation is successful
        // therefore we can safely assume that data.unitCreateOne.record is not null
        setItem(data.unitCreateOne!.record!);
        toast({
            title: 'Unit saved',
            description: `${data.unitCreateOne!.record!.longSingular} saved`,
            position: 'top',
        });
    };
    return (
        <PopoverContent paddingRight={4} paddingBottom={3} paddingLeft={2}>
            <PopoverArrow />
            <PopoverCloseButton />
            <PopoverHeader border='hidden'>Add new unit</PopoverHeader>
            <CreateUnitForm fieldRef={fieldRef} handleComplete={handleComplete} pl={2} />
        </PopoverContent>
    );
}
