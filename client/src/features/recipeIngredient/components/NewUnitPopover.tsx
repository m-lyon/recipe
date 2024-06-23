import { useToast } from '@chakra-ui/react';
import { PopoverArrow, PopoverHeader } from '@chakra-ui/react';
import { PopoverCloseButton, PopoverContent } from '@chakra-ui/react';

import { DELAY_LONG } from '@recipe/constants';
import { CREATE_UNIT } from '@recipe/graphql/mutations/unit';
import { CreateUnitMutation } from '@recipe/graphql/generated';

import { UnitForm } from './UnitForm';
import { UnitSuggestion } from './UnitDropdown';

interface Props {
    fieldRef: React.MutableRefObject<HTMLInputElement | null>;
    onClose: () => void;
    handleSelect: (item: UnitSuggestion) => void;
}
export function NewUnitPopover(props: Props) {
    const { fieldRef, onClose, handleSelect } = props;
    const toast = useToast();

    const handleComplete = (data: CreateUnitMutation) => {
        onClose();
        handleSelect({
            value: data.unitCreateOne!.record!,
            colour: undefined,
        });
        toast({
            title: 'Unit saved',
            description: `${data?.unitCreateOne?.record?.longSingular} saved`,
            status: 'success',
            position: 'top',
            duration: DELAY_LONG,
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
