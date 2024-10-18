import { MutableRefObject } from 'react';
import { PopoverArrow, PopoverCloseButton, PopoverContent, PopoverHeader } from '@chakra-ui/react';

import { useSuccessToast } from '@recipe/common/hooks';

interface BasePopoverProps<TChoice, TData> {
    fieldRef: MutableRefObject<HTMLInputElement | null>;
    onClose: () => void;
    setItem: (item: TChoice) => void;
    title: string;
    FormComponent: React.ComponentType<{
        fieldRef: MutableRefObject<HTMLInputElement | null>;
        handleComplete: (data: TData) => void;
        pl: number;
    }>;
    extractRecord: (data: TData) => TChoice;
    extractDescription: (record: TChoice) => string;
}

export function BasePopover<TChoice, TData>(props: BasePopoverProps<TChoice, TData>) {
    const { fieldRef, onClose, setItem, title, FormComponent, extractRecord, extractDescription } =
        props;
    const toast = useSuccessToast();

    const handleComplete = (data: TData) => {
        onClose();
        const record = extractRecord(data);
        setItem(record);
        toast({
            title: `${title} saved`,
            description: extractDescription(record),
            position: 'top',
        });
    };

    return (
        <PopoverContent paddingRight={4} paddingBottom={3} paddingLeft={2}>
            <PopoverArrow />
            <PopoverCloseButton aria-label={`Close new ${title.toLowerCase()} form`} />
            <PopoverHeader border='hidden'>Add new {title.toLowerCase()}</PopoverHeader>
            <FormComponent fieldRef={fieldRef} handleComplete={handleComplete} pl={2} />
        </PopoverContent>
    );
}
