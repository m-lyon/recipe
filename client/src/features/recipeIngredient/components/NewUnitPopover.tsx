import { PopoverArrow, PopoverHeader } from '@chakra-ui/react';
import { PopoverCloseButton, PopoverContent } from '@chakra-ui/react';

import { useSuccessToast } from '@recipe/common/hooks';
import { CREATE_UNIT } from '@recipe/graphql/mutations/unit';
import { CreateUnitMutation, Unit } from '@recipe/graphql/generated';

import { UnitForm } from './UnitForm';

interface Props {
    fieldRef: React.MutableRefObject<HTMLInputElement | null>;
    onClose: () => void;
    handleSelect: (item: Unit) => void;
}
export function NewUnitPopover(props: Props) {
    const { fieldRef, onClose, handleSelect } = props;
    const toast = useSuccessToast();

    const handleComplete = (data: CreateUnitMutation) => {
        onClose();
        handleSelect(data.unitCreateOne!.record!);
        toast({
            title: 'Unit saved',
            description: `${data?.unitCreateOne?.record?.longSingular} saved`,
            position: 'top',
        });
    };
    return (
        <PopoverContent paddingRight={4} paddingBottom={3} paddingLeft={2}>
            <PopoverArrow />
            <PopoverCloseButton />
            <PopoverHeader border='hidden'>Add new unit</PopoverHeader>
            <UnitForm
                fieldRef={fieldRef}
                mutation={CREATE_UNIT}
                handleComplete={handleComplete}
                pl={2}
            />
        </PopoverContent>
    );
}
