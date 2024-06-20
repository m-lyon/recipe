import { setRecordOwnerAsUser } from '../middleware/create.js';
import { filterIsOwnerOrAdmin } from '../middleware/filters.js';
import { createOneResolver, updateByIdResolver } from './utils.js';
import { Ingredient, IngredientCreateTC, IngredientTC } from '../models/Ingredient.js';

IngredientTC.addResolver({
    name: 'updateById',
    description: 'Update an ingredient by its ID',
    type: IngredientTC.mongooseResolvers.updateById().getType(),
    args: IngredientTC.mongooseResolvers.updateById().getArgs(),
    resolve: updateByIdResolver(Ingredient, IngredientTC),
});

IngredientCreateTC.addResolver({
    name: 'createOne',
    description: 'Create a new ingredient',
    type: IngredientTC.mongooseResolvers.createOne().getType(),
    args: IngredientCreateTC.mongooseResolvers.createOne().getArgs(),
    resolve: createOneResolver(Ingredient, IngredientCreateTC),
});

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
    ingredientCreateOne:
        IngredientCreateTC.getResolver('createOne').wrapResolve(setRecordOwnerAsUser()),
    ingredientUpdateById: IngredientTC.getResolver('updateById'),
    ingredientRemoveById: IngredientTC.mongooseResolvers
        .removeById()
        .setDescription('Remove an ingredient by its ID'),
    ingredientRemoveOne: IngredientTC.mongooseResolvers
        .removeOne()
        .setDescription('Remove a single ingredient'),
};
