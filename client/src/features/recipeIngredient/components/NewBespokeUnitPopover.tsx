import { MutableRefObject } from 'react';
import { PopoverArrow, PopoverHeader } from '@chakra-ui/react';
import { PopoverCloseButton, PopoverContent } from '@chakra-ui/react';

import { CreateUnitMutation, Unit } from '@recipe/graphql/generated';

import { BeskpokeUnitForm } from './BespokeUnitForm';

interface Props {
    fieldRef: MutableRefObject<HTMLInputElement | null>;
    value: string;
    setValue: (value: string) => void;
    onClose: () => void;
    setItem: (item: Unit) => void;
}
export function NewBespokeUnitPopover(props: Props) {
    const { fieldRef, value, setValue, onClose, setItem } = props;

    const handleComplete = (data: CreateUnitMutation) => {
        onClose();
        setItem(data.unitCreateOne!.record!);
    };
    return (
        <PopoverContent paddingRight={4} paddingBottom={3} paddingLeft={2}>
            <PopoverArrow />
            <PopoverCloseButton />
            <PopoverHeader border='hidden'>Use bespoke unit</PopoverHeader>
            <BeskpokeUnitForm
                fieldRef={fieldRef}
                value={value}
                setValue={setValue}
                handleComplete={handleComplete}
                pl={2}
            />
        </PopoverContent>
    );
}
