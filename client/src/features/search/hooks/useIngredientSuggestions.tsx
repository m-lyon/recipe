import { useQuery } from '@apollo/client';
import { matchSorter } from 'match-sorter';

import { GET_INGREDIENT_AND_RECIPE_INGREDIENTS } from '@recipe/graphql/queries/recipe';

export function useIngredientSuggestions(selected: TagChoice[], query: string) {
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

    return suggestions;
}
