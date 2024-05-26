import { PopoverCloseButton, PopoverContent } from '@chakra-ui/react';
import { PopoverArrow, PopoverHeader, useToast } from '@chakra-ui/react';

import { CreateIngredientMutation } from '@recipe/graphql/generated';
import { CREATE_INGREDIENT } from '@recipe/graphql/mutations/ingredient';

import { IngredientSuggestion } from './IngredientDropdown';
import { IngredientForm } from './IngredientForm';

interface Props {
    fieldRef: React.MutableRefObject<HTMLInputElement | null>;
    onClose: () => void;
    handleSelect: (item: IngredientSuggestion) => void;
}
export function NewIngredientPopover(props: Props) {
    const { fieldRef, onClose, handleSelect } = props;
    const toast = useToast();

    const handleComplete = (data: CreateIngredientMutation) => {
        onClose();
        handleSelect({
            value: data!.ingredientCreateOne!.record!,
            colour: undefined,
        });
        toast({
            title: 'Ingredient saved',
            description: `${data?.ingredientCreateOne?.record?.name} saved`,
            status: 'success',
            position: 'top',
            duration: 3000,
        });
    };

    return (
        <PopoverContent paddingRight={4} paddingBottom={3} paddingLeft={2}>
            <PopoverArrow />
            <PopoverCloseButton />
            <PopoverHeader border='hidden'>Add new ingredient</PopoverHeader>
            <IngredientForm
                fieldRef={fieldRef}
                mutation={CREATE_INGREDIENT}
                handleComplete={handleComplete}
            />
        </PopoverContent>
    );
}
