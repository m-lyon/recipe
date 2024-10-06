import { MutableRefObject } from 'react';
import { PopoverArrow, PopoverHeader } from '@chakra-ui/react';
import { PopoverCloseButton, PopoverContent } from '@chakra-ui/react';

import { useSuccessToast } from '@recipe/common/hooks';
import { CreatePrepMethodForm } from '@recipe/features/forms';
import { CreatePrepMethodMutation } from '@recipe/graphql/generated';

interface Props {
    fieldRef: MutableRefObject<HTMLInputElement | null>;
    onClose: () => void;
    setItem: (item: PrepMethodChoice) => void;
}
export function NewPrepMethodPopover(props: Props) {
    const { fieldRef, onClose, setItem } = props;
    const toast = useSuccessToast();

    const handleComplete = (data: CreatePrepMethodMutation) => {
        onClose();
        setItem(data.prepMethodCreateOne!.record!);
        toast({
            title: 'Prep method saved',
            description: `${data.prepMethodCreateOne!.record!.value} saved`,
            position: 'top',
        });
    };

    return (
        <PopoverContent paddingRight={4} paddingBottom={3} paddingLeft={2}>
            <PopoverArrow />
            <PopoverCloseButton />
            <PopoverHeader border='hidden'>Add new prep method</PopoverHeader>
            <CreatePrepMethodForm fieldRef={fieldRef} handleComplete={handleComplete} />
        </PopoverContent>
    );
}
