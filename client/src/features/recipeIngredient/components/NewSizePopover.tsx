import { PopoverArrow, PopoverHeader } from '@chakra-ui/react';
import { PopoverCloseButton, PopoverContent } from '@chakra-ui/react';

import { useSuccessToast } from '@recipe/common/hooks';
import { CREATE_SIZE } from '@recipe/graphql/mutations/size';
import { CreateSizeMutation, Size } from '@recipe/graphql/generated';

import { SizeForm } from './SizeForm';

interface Props {
    fieldRef: React.MutableRefObject<HTMLInputElement | null>;
    onClose: () => void;
    setItem: (item: Size) => void;
}
export function NewSizePopover(props: Props) {
    const { fieldRef, onClose, setItem } = props;
    const toast = useSuccessToast();

    const handleComplete = (data: CreateSizeMutation) => {
        onClose();
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
            <SizeForm fieldRef={fieldRef} mutation={CREATE_SIZE} handleComplete={handleComplete} />
        </PopoverContent>
    );
}
