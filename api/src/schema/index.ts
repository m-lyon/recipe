import { SchemaComposer } from 'graphql-compose';
import { TagQuery, TagMutation } from './Tag.js';
import { UnitQuery, UnitMutation } from './Unit.js';
import { PrepMethodQuery, PrepMethodMutation } from './PrepMethod.js';
import { IngredientQuery, IngredientMutation } from './Ingredient.js';
// import { CuisineQuery, CuisineMutation } from './Cuisine.js';
// import { RecipeQuery, RecipeMutation } from './Recipe.js';

const schemaComposer = new SchemaComposer();
schemaComposer.Query.addFields({
    ...TagQuery,
    ...UnitQuery,
    ...PrepMethodQuery,
    ...IngredientQuery,
});
schemaComposer.Mutation.addFields({
    ...TagMutation,
    ...UnitMutation,
    ...PrepMethodMutation,
    ...IngredientMutation,
});
export const schema = schemaComposer.buildSchema();
