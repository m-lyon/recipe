import { MutableRefObject, useRef } from 'react';
import { matchSorter } from 'match-sorter';
import { LayoutGroup } from 'framer-motion';
import { Popover, PopoverAnchor, useDisclosure } from '@chakra-ui/react';
import { EnumRecipeIngredientType } from '../../../../../__generated__/graphql';
import { GetIngredientsQuery } from '../../../../../__generated__/graphql';
import { Ingredient } from '../../../../../__generated__/graphql';
import { DropdownItem } from '../../../../../components/DropdownItem';
import { useNavigatableList } from '../../../hooks/useNavigatableList';
import { NewIngredientPopover } from './NewIngredientPopover';

export function isPluralIngredient(
    plural: boolean,
    hasUnit: boolean,
    isCountable: boolean
): boolean {
    return (plural && !hasUnit) || (isCountable && hasUnit);
}

function getDisplayValue(item: IngredientSuggestion, plural: boolean, hasUnit: boolean): string {
    if (typeof item.value === 'string') {
        return item.value;
    } else if (isPluralIngredient(plural, hasUnit, item.value.isCountable)) {
        return item.value.pluralName;
    } else {
        return item.value.name;
    }
}

interface IngredientOrRecipe extends Ingredient {
    type: EnumRecipeIngredientType;
}
export interface IngredientSuggestion {
    value: string | IngredientOrRecipe;
    colour?: string;
}
interface Props {
    strValue: string;
    ingredients: GetIngredientsQuery['ingredientMany'];
    recipes?: GetIngredientsQuery['recipeMany'];
    plural: boolean;
    hasUnit: boolean;
    setItem: (value: string | null, _id?: string, type?: EnumRecipeIngredientType) => void;
    inputRef: MutableRefObject<HTMLInputElement | null>;
    previewRef: MutableRefObject<HTMLDivElement | null>;
}
export function IngredientNameDropdownList(props: Props) {
    const { strValue, ingredients, recipes, plural, hasUnit, setItem, inputRef, previewRef } =
        props;
    const dropdownRef = useRef<HTMLDivElement | null>(null);
    const firstFieldRef = useRef<HTMLInputElement | null>(null);
    const { isOpen, onOpen, onClose } = useDisclosure({
        onClose: () => {
            previewRef.current?.focus();
        },
    });
    const data = ingredients
        .map((ingredient) => ({
            ...ingredient,
            type: 'ingredient',
        }))
        .concat(
            recipes?.map((recipe) => ({
                _id: recipe._id,
                name: recipe.title.toLowerCase(),
                pluralName: recipe.pluralTitle!.toLowerCase(),
                isCountable: false,
                type: 'recipe',
            })) || []
        ) as IngredientOrRecipe[];
    const filter = (data: IngredientOrRecipe[], value: string): IngredientSuggestion[] => {
        const items = matchSorter<IngredientOrRecipe>(data, value, {
            keys: ['name', 'pluralName'],
        }).map((item) => ({ value: item, colour: undefined })) as IngredientSuggestion[];
        if (items.length === 0) {
            items.push({ value: 'add new ingredient', colour: 'gray.400' });
        }
        return items;
    };
    const suggestions = filter(data, strValue);

    const handleSelect = (item: IngredientSuggestion) => {
        if (typeof item.value === 'string') {
            if (item.value === 'add new ingredient') {
                onOpen();
            }
        } else {
            setItem(
                getDisplayValue(item, plural, hasUnit),
                item.value._id,
                item.value.type as EnumRecipeIngredientType
            );
        }
    };

    const { highlightedIndex, setHighlightedIndex } = useNavigatableList<IngredientSuggestion>(
        suggestions,
        handleSelect,
        inputRef
    );

    const listItems = suggestions.map((item, index) => {
        if (item.value === 'add new ingredient') {
            return (
                <PopoverAnchor key={index}>
                    <DropdownItem
                        key={index}
                        color={item.colour}
                        value={item.value}
                        onClick={() => {
                            handleSelect(item);
                            previewRef?.current?.focus();
                        }}
                        isHighlighted={index === highlightedIndex}
                        setHighlighted={() => setHighlightedIndex(index)}
                        resetHighlighted={() => setHighlightedIndex(-1)}
                        ref={dropdownRef}
                    />
                </PopoverAnchor>
            );
        }
        return (
            <DropdownItem
                key={index}
                color={item.colour}
                value={getDisplayValue(item, plural, hasUnit)}
                onClick={() => {
                    handleSelect(item);
                    previewRef?.current?.focus();
                }}
                isHighlighted={index === highlightedIndex}
                setHighlighted={() => setHighlightedIndex(index)}
                resetHighlighted={() => setHighlightedIndex(-1)}
            />
        );
    });

    return (
        <Popover
            isOpen={isOpen}
            onOpen={onOpen}
            onClose={onClose}
            closeOnBlur={false}
            placement='right'
            initialFocusRef={firstFieldRef}
            returnFocusOnClose={true}
        >
            <LayoutGroup>{listItems}</LayoutGroup>
            <NewIngredientPopover
                firstFieldRef={firstFieldRef}
                onClose={onClose}
                handleSelect={handleSelect}
            />
        </Popover>
    );
}
