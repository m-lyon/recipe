import { PopoverArrow, PopoverHeader } from '@chakra-ui/react';
import { PopoverCloseButton, PopoverContent } from '@chakra-ui/react';

import { useSuccessToast } from '@recipe/common/hooks';
import { CreateIngredientMutation } from '@recipe/graphql/generated';
import { CREATE_INGREDIENT } from '@recipe/graphql/mutations/ingredient';

import { IngredientForm } from './IngredientForm';
import { IngredientSuggestion } from './IngredientDropdown';

interface Props {
    fieldRef: React.MutableRefObject<HTMLInputElement | null>;
    onClose: () => void;
    handleSelect: (item: IngredientSuggestion) => void;
}
export function NewIngredientPopover(props: Props) {
    const { fieldRef, onClose, handleSelect } = props;
    const toast = useSuccessToast();

    const handleComplete = (data: CreateIngredientMutation) => {
        onClose();
        handleSelect({
            value: data!.ingredientCreateOne!.record!,
            colour: undefined,
        });
        toast({
            title: 'Ingredient saved',
            description: `${data?.ingredientCreateOne?.record?.name} saved`,
            position: 'top',
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
