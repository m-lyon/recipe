import { RecipeIngredientTC, RecipeTC } from '../models/Recipe.js';
import { TagTC } from '../models/Tag.js';
import { UnitTC } from '../models/Unit.js';
import { IngredientTC } from '../models/Ingredient.js';
import { PrepMethodTC } from '../models/PrepMethod.js';

RecipeTC.addRelation('tags', {
    resolver: () => TagTC.mongooseResolvers.findByIds(),
    prepareArgs: {
        _ids: (source) => source.tags?.map((o) => o._id),
    },
    projection: { tags: true },
});
RecipeIngredientTC.addRelation('unit', {
    resolver: () => UnitTC.mongooseResolvers.findById(),
    prepareArgs: {
        _id: (source) => source.unit?._id,
    },
    projection: { unit: true },
});
RecipeIngredientTC.addRelation('ingredient', {
    resolver: () => IngredientTC.mongooseResolvers.findById(),
    prepareArgs: {
        _id: (source) => source.ingredient._id,
    },
    projection: { ingredient: true },
});
RecipeIngredientTC.addRelation('prepMethod', {
    resolver: () => PrepMethodTC.mongooseResolvers.findById(),
    prepareArgs: {
        _id: (source) => source.prepMethod?._id,
    },
    projection: { prepMethod: true },
});

export const RecipeQuery = {
    recipeById: RecipeTC.mongooseResolvers.findById(),
    recipeByIds: RecipeTC.mongooseResolvers.findByIds(),
    recipeOne: RecipeTC.mongooseResolvers.findOne(),
    recipeMany: RecipeTC.mongooseResolvers.findMany(),
    // recipeDataLoader: RecipeTC.mongooseResolvers.dataLoader(),
    // recipeDataLoaderMany: RecipeTC.mongooseResolvers.dataLoaderMany(),
    // recipeCount: RecipeTC.mongooseResolvers.count(),
    // recipeConnection: RecipeTC.mongooseResolvers.connection(),
    // recipePagination: RecipeTC.mongooseResolvers.pagination(),
};

export const RecipeMutation = {
    // 'many' methods are commented out because they are not currently used
    // by frontend. They are left here for reference.
    recipeCreateOne: RecipeTC.mongooseResolvers.createOne(),
    // recipeCreateMany: RecipeTC.mongooseResolvers.createMany(),
    recipeUpdateById: RecipeTC.mongooseResolvers.updateById(),
    // recipeUpdateOne: RecipeTC.mongooseResolvers.updateOne(), // not used because resolver logic would need to be updated to find via findOne
    // recipeUpdateMany: RecipeTC.mongooseResolvers.updateMany(),
    recipeRemoveById: RecipeTC.mongooseResolvers.removeById(),
    // recipeRemoveOne: RecipeTC.mongooseResolvers.removeOne(),
    // recipeRemoveMany: RecipeTC.mongooseResolvers.removeMany(),
};
