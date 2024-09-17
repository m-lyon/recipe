import { PopoverArrow, PopoverHeader } from '@chakra-ui/react';
import { PopoverCloseButton, PopoverContent } from '@chakra-ui/react';

import { IngredientAndRecipe } from '@recipe/types';
import { useSuccessToast } from '@recipe/common/hooks';
import { CreateIngredientMutation } from '@recipe/graphql/generated';
import { CREATE_INGREDIENT } from '@recipe/graphql/mutations/ingredient';

import { IngredientForm } from './IngredientForm';

interface Props {
    fieldRef: React.MutableRefObject<HTMLInputElement | null>;
    onClose: () => void;
    setItem: (item: IngredientAndRecipe) => void;
}
export function NewIngredientPopover(props: Props) {
    const { fieldRef, onClose, setItem } = props;
    const toast = useSuccessToast();

    const handleComplete = (data: CreateIngredientMutation) => {
        onClose();
        setItem(data!.ingredientCreateOne!.record!);
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
