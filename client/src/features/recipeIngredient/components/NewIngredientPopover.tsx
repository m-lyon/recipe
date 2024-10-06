import { MutableRefObject } from 'react';
import { PopoverArrow, PopoverHeader } from '@chakra-ui/react';
import { PopoverCloseButton, PopoverContent } from '@chakra-ui/react';

import { useSuccessToast } from '@recipe/common/hooks';
import { CreateIngredientForm } from '@recipe/features/forms';
import { CreateIngredientMutation } from '@recipe/graphql/generated';

interface Props {
    fieldRef: MutableRefObject<HTMLInputElement | null>;
    onClose: () => void;
    setItem: (item: IngredientChoice) => void;
}
export function NewIngredientPopover(props: Props) {
    const { fieldRef, onClose, setItem } = props;
    const toast = useSuccessToast();

    const handleComplete = (data: CreateIngredientMutation) => {
        onClose();
        // handleComplete is called when the mutation is successful
        // therefore we can safely assume that data.ingredientCreateOne.record is not null
        setItem(data.ingredientCreateOne!.record!);
        toast({
            title: 'Ingredient saved',
            description: `${data.ingredientCreateOne!.record!.name} saved`,
            position: 'top',
        });
    };

    return (
        <PopoverContent paddingRight={4} paddingBottom={3} paddingLeft={2}>
            <PopoverArrow />
            <PopoverCloseButton />
            <PopoverHeader border='hidden'>Add new ingredient</PopoverHeader>
            <CreateIngredientForm handleComplete={handleComplete} fieldRef={fieldRef} />
        </PopoverContent>
    );
}
