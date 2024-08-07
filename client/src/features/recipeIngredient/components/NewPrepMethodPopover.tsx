import { PopoverArrow, PopoverHeader } from '@chakra-ui/react';
import { PopoverCloseButton, PopoverContent } from '@chakra-ui/react';

import { useSuccessToast } from '@recipe/common/hooks';
import { CreatePrepMethodMutation } from '@recipe/graphql/generated';
import { CREATE_PREP_METHOD } from '@recipe/graphql/mutations/prepMethod';

import { PrepMethodForm } from './PrepMethodForm';
import { PrepMethodSuggestion } from './PrepMethodDropdown';

interface Props {
    fieldRef: React.MutableRefObject<HTMLInputElement | null>;
    onClose: () => void;
    handleSelect: (item: PrepMethodSuggestion) => void;
}
export function NewPrepMethodPopover(props: Props) {
    const { fieldRef, onClose, handleSelect } = props;
    const toast = useSuccessToast();

    const handleComplete = (data: CreatePrepMethodMutation) => {
        onClose();
        handleSelect({
            value: data.prepMethodCreateOne!.record!,
            colour: undefined,
        });
        toast({
            title: 'Prep method saved',
            description: `${data?.prepMethodCreateOne?.record?.value} saved`,
            position: 'top',
        });
    };

    return (
        <PopoverContent paddingRight={4} paddingBottom={3} paddingLeft={2}>
            <PopoverArrow />
            <PopoverCloseButton />
            <PopoverHeader border='hidden'>Add new prep method</PopoverHeader>
            <PrepMethodForm
                fieldRef={fieldRef}
                mutation={CREATE_PREP_METHOD}
                handleComplete={handleComplete}
            />
        </PopoverContent>
    );
}
