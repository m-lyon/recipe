import { RefObject } from 'react';

import { NewBespokeUnitPopover, NewIngredientPopover } from '@recipe/features/popovers';
import { NewPrepMethodPopover, NewSizePopover, NewUnitPopover } from '@recipe/features/popovers';

interface Props {
    fieldRef: RefObject<HTMLInputElement>;
    onClose: () => void;
    setItem: (attr: RecipeIngredientDropdown) => void;
    item: EditableRecipeIngredient;
    bespokeValue: string;
    setBespokeValue: (value: string) => void;
}
export function NewItemPopover(props: Props) {
    const { item, bespokeValue, setBespokeValue, ...rest } = props;
    switch (item.popover) {
        case 'unit':
            return <NewUnitPopover {...rest} />;
        case 'bespokeUnit':
            return (
                <NewBespokeUnitPopover {...rest} value={bespokeValue} setValue={setBespokeValue} />
            );
        case 'size':
            return <NewSizePopover {...rest} />;
        case 'ingredient':
            return <NewIngredientPopover {...rest} />;
        case 'prepMethod':
            return <NewPrepMethodPopover {...rest} />;
        default:
            return null;
    }
}
