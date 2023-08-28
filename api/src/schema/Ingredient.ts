import { IngredientTC } from '../models/Ingredient.js';
import { PrepMethodTC } from '../models/PrepMethod.js';

IngredientTC.addRelation('prepMethods', {
    resolver: () => PrepMethodTC.mongooseResolvers.findByIds(),
    prepareArgs: {
        _ids: (source) => source.prepMethods.map((o) => o._id),
    },
    projection: { prepMethods: true },
});

export const IngredientQuery = {
    ingredientById: IngredientTC.mongooseResolvers.findById(),
    ingredientByIds: IngredientTC.mongooseResolvers.findByIds(),
    ingredientOne: IngredientTC.mongooseResolvers.findOne(),
    ingredientMany: IngredientTC.mongooseResolvers.findMany(),
    ingredientDataLoader: IngredientTC.mongooseResolvers.dataLoader(),
    ingredientDataLoaderMany: IngredientTC.mongooseResolvers.dataLoaderMany(),
    ingredientCount: IngredientTC.mongooseResolvers.count(),
    ingredientConnection: IngredientTC.mongooseResolvers.connection(),
    ingredientPagination: IngredientTC.mongooseResolvers.pagination(),
};

export const IngredientMutation = {
    ingredientCreateOne: IngredientTC.mongooseResolvers.createOne(),
    ingredientCreateMany: IngredientTC.mongooseResolvers.createMany(),
    ingredientUpdateById: IngredientTC.mongooseResolvers.updateById(),
    ingredientUpdateOne: IngredientTC.mongooseResolvers.updateOne(),
    ingredientUpdateMany: IngredientTC.mongooseResolvers.updateMany(),
    ingredientRemoveById: IngredientTC.mongooseResolvers.removeById(),
    ingredientRemoveOne: IngredientTC.mongooseResolvers.removeOne(),
    ingredientRemoveMany: IngredientTC.mongooseResolvers.removeMany(),
};
