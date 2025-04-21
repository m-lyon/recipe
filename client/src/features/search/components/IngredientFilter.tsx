import { useSearchStore } from '@recipe/stores';

import { Filter } from './Filter';
import { useIngredientSuggestions } from '../hooks/useIngredientSuggestions';

interface Props {
    addFilter: (item: FilterChoice, type: FilterChoiceType) => void;
}
export function IngredientFilter(props: Props) {
    const { addFilter } = props;
    const query = useSearchStore((state) => state.ingrQuery);
    const setQuery = useSearchStore((state) => state.setIngrQuery);
    const open = useSearchStore((state) => state.showIngrDropdown);
    const selected = useSearchStore((state) => state.selectedIngredients);
    const setIsOpen = useSearchStore((state) => state.setShowIngrDropdown);
    const suggestions = useIngredientSuggestions(selected, query);

    return (
        <Filter
            value={query}
            setValue={setQuery}
            placeholder='Filter by ingredients'
            open={open}
            setIsOpen={setIsOpen}
            addItem={(item) => {
                addFilter(item, 'Ingredient');
                setQuery('');
            }}
            suggestions={suggestions}
        />
    );
}
