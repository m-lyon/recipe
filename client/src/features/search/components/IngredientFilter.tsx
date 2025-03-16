import { useQuery } from '@apollo/client';
import { matchSorter } from 'match-sorter';

import { useSearchStore } from '@recipe/stores';
import { GET_INGREDIENT_AND_RECIPE_INGREDIENTS } from '@recipe/graphql/queries/recipe';

import { Filter } from './Filter';

interface Props {
    addFilter: (item: FilterChoice, type: FilterChoiceType) => void;
}
export function IngredientFilter(props: Props) {
    const { addFilter } = props;
    const query = useSearchStore((state) => state.ingrQuery);
    const setQuery = useSearchStore((state) => state.setIngrQuery);
    const isOpen = useSearchStore((state) => state.showIngrDropdown);
    const selected = useSearchStore((state) => state.selectedIngredients);
    const setIsOpen = useSearchStore((state) => state.setShowIngrDropdown);

    const { data } = useQuery(GET_INGREDIENT_AND_RECIPE_INGREDIENTS);
    const ingrs: FilterChoice[] = data
        ? [
              ...data.ingredients.map((ingr) => ({
                  value: ingr.name,
                  _id: ingr._id,
              })),
              ...data.recipes.map((recipe) => ({
                  value: recipe.title,
                  _id: recipe._id,
              })),
          ]
        : [];
    const suggestions = matchSorter<FilterChoice>(
        ingrs.filter((ingr) => !selected.find((s) => s._id === ingr._id)),
        query,
        { keys: ['value'] }
    );

    return (
        <Filter
            value={query}
            setValue={setQuery}
            placeholder='Filter by ingredients'
            isOpen={isOpen}
            setIsOpen={setIsOpen}
            addItem={(item) => addFilter(item, 'Ingredient')}
            suggestions={suggestions}
        />
    );
}
