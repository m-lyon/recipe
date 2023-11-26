import { SchemaComposer } from 'graphql-compose';
import { TagQuery, TagMutation } from './Tag.js';
import { UnitQuery, UnitMutation } from './Unit.js';
import { UserQuery, UserMutation } from './User.js';
import { PrepMethodQuery, PrepMethodMutation } from './PrepMethod.js';
import { IngredientQuery, IngredientMutation } from './Ingredient.js';
import { CuisineQuery, CuisineMutation } from './Cuisine.js';
import { RecipeQuery, RecipeMutation } from './Recipe.js';
import { applyMiddleware } from 'graphql-middleware';
import { permissions } from '../middleware/shield.js';

const schemaComposer = new SchemaComposer();
schemaComposer.Query.addFields({
    ...TagQuery,
    ...UserQuery,
    ...UnitQuery,
    ...PrepMethodQuery,
    ...IngredientQuery,
    ...CuisineQuery,
    ...RecipeQuery,
});
schemaComposer.Mutation.addFields({
    ...TagMutation,
    ...UnitMutation,
    ...UserMutation,
    ...PrepMethodMutation,
    ...IngredientMutation,
    ...CuisineMutation,
    ...RecipeMutation,
});
export const schema = applyMiddleware(schemaComposer.buildSchema(), permissions);
