import { filterIsOwnerOrAdmin } from '../middleware/filters.js';
import { IngredientCreateTC, IngredientTC } from '../models/Ingredient.js';
import { setRecordOwnerAsUser } from '../middleware/create.js';

export const IngredientQuery = {
    ingredientById: IngredientTC.mongooseResolvers
        .findById()
        .setDescription('Retrieve an ingredient by its ID'),
    ingredientByIds: IngredientTC.mongooseResolvers
        .findByIds()
        .setDescription('Retrieve multiple ingredients by their IDs'),
    ingredientOne: IngredientTC.mongooseResolvers
        .findOne()
        .setDescription('Retrieve a single ingredient'),
    ingredientMany: IngredientTC.mongooseResolvers
        .findMany()
        .wrapResolve(filterIsOwnerOrAdmin())
        .setDescription('Retrieve multiple ingredients'),
    ingredientManyAll: IngredientTC.mongooseResolvers
        .findMany()
        .setDescription('Retrieve all ingredients'),
};

export const IngredientMutation = {
    ingredientCreateOne: IngredientCreateTC.mongooseResolvers
        .createOne()
        .wrapResolve(setRecordOwnerAsUser())
        .setDescription('Create a new ingredient'),
    ingredientUpdateById: IngredientTC.mongooseResolvers
        .updateById()
        .setDescription('Update an ingredient by its ID'),
    ingredientUpdateOne: IngredientTC.mongooseResolvers
        .updateOne()
        .setDescription('Update a single ingredient'),
    ingredientRemoveById: IngredientTC.mongooseResolvers
        .removeById()
        .setDescription('Remove an ingredient by its ID'),
    ingredientRemoveOne: IngredientTC.mongooseResolvers
        .removeOne()
        .setDescription('Remove a single ingredient'),
};
