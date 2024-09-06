import { PopoverArrow, PopoverHeader } from '@chakra-ui/react';
import { PopoverCloseButton, PopoverContent } from '@chakra-ui/react';

import { CreateUnitMutation } from '@recipe/graphql/generated';

import { UnitSuggestion } from './UnitDropdown';
import { BeskpokeUnitForm } from './BespokeUnitForm';

interface Props {
    value: string;
    setValue: (value: string) => void;
    onClose: () => void;
    handleSelect: (item: UnitSuggestion) => void;
}
export function NewBespokeUnitPopover(props: Props) {
    const { value, setValue, onClose, handleSelect } = props;

    const handleComplete = (data: CreateUnitMutation) => {
        onClose();
        handleSelect({
            value: data.unitCreateOne!.record!,
            colour: undefined,
        });
    };
    return (
        <PopoverContent paddingRight={4} paddingBottom={3} paddingLeft={2}>
            <PopoverArrow />
            <PopoverCloseButton />
            <PopoverHeader border='hidden'>Use bespoke unit</PopoverHeader>
            <BeskpokeUnitForm
                value={value}
                setValue={setValue}
                handleComplete={handleComplete}
                pl={2}
            />
        </PopoverContent>
    );
}
