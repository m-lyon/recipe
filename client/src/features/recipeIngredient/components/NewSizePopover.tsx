import { MutableRefObject } from 'react';
import { PopoverArrow, PopoverHeader } from '@chakra-ui/react';
import { PopoverCloseButton, PopoverContent } from '@chakra-ui/react';

import { useSuccessToast } from '@recipe/common/hooks';
import { CreateSizeForm } from '@recipe/features/forms';
import { CreateSizeMutation } from '@recipe/graphql/generated';

interface Props {
    fieldRef: MutableRefObject<HTMLInputElement | null>;
    onClose: () => void;
    setItem: (item: SizeChoice) => void;
}
export function NewSizePopover(props: Props) {
    const { fieldRef, onClose, setItem } = props;
    const toast = useSuccessToast();

    const handleComplete = (data: CreateSizeMutation) => {
        onClose();
        // handleComplete is called when the mutation is successful
        // therefore we can safely assume that data.sizeCreateOne.record is not null
        setItem(data.sizeCreateOne!.record!);
        toast({
            title: 'Size saved',
            description: `${data?.sizeCreateOne?.record?.value} saved`,
            position: 'top',
        });
    };

    return (
        <PopoverContent paddingRight={4} paddingBottom={3} paddingLeft={2}>
            <PopoverArrow />
            <PopoverCloseButton />
            <PopoverHeader border='hidden'>Add new size</PopoverHeader>
            <CreateSizeForm fieldRef={fieldRef} handleComplete={handleComplete} />
        </PopoverContent>
    );
}
