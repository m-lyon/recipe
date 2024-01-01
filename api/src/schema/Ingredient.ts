import { IngredientTC } from '../models/Ingredient.js';

export const IngredientQuery = {
    ingredientById: IngredientTC.mongooseResolvers.findById(),
    ingredientByIds: IngredientTC.mongooseResolvers.findByIds(),
    ingredientOne: IngredientTC.mongooseResolvers.findOne(),
    ingredientMany: IngredientTC.mongooseResolvers.findMany(),
};

export const IngredientMutation = {
    ingredientCreateOne: IngredientTC.mongooseResolvers.createOne(),
    ingredientUpdateById: IngredientTC.mongooseResolvers.updateById(),
    ingredientUpdateOne: IngredientTC.mongooseResolvers.updateOne(),
    ingredientRemoveById: IngredientTC.mongooseResolvers.removeById(),
    ingredientRemoveOne: IngredientTC.mongooseResolvers.removeOne(),
};
