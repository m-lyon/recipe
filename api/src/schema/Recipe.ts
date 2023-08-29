import { RecipeTC } from '../models/Recipe.js';
import { TagTC } from '../models/Tag.js';
import { CuisineTC } from '../models/Cuisine.js';

RecipeTC.addRelation('tags', {
    resolver: () => TagTC.mongooseResolvers.findByIds(),
    prepareArgs: {
        _ids: (source) => source.tags?.map((o) => o._id),
    },
    projection: { tags: true },
});
RecipeTC.addRelation('cuisine', {
    resolver: () => CuisineTC.mongooseResolvers.findByIds(),
    prepareArgs: {
        _ids: (source) => source.cuisine?.map((o) => o._id),
    },
    projection: { tags: true },
});

export const RecipeQuery = {
    recipeById: RecipeTC.mongooseResolvers.findById(),
    recipeByIds: RecipeTC.mongooseResolvers.findByIds(),
    recipeOne: RecipeTC.mongooseResolvers.findOne(),
    recipeMany: RecipeTC.mongooseResolvers.findMany(),
    recipeDataLoader: RecipeTC.mongooseResolvers.dataLoader(),
    recipeDataLoaderMany: RecipeTC.mongooseResolvers.dataLoaderMany(),
    recipeCount: RecipeTC.mongooseResolvers.count(),
    recipeConnection: RecipeTC.mongooseResolvers.connection(),
    recipePagination: RecipeTC.mongooseResolvers.pagination(),
};

export const RecipeMutation = {
    recipeCreateOne: RecipeTC.mongooseResolvers.createOne(),
    recipeCreateMany: RecipeTC.mongooseResolvers.createMany(),
    recipeUpdateById: RecipeTC.mongooseResolvers.updateById(),
    recipeUpdateOne: RecipeTC.mongooseResolvers.updateOne(),
    recipeUpdateMany: RecipeTC.mongooseResolvers.updateMany(),
    recipeRemoveById: RecipeTC.mongooseResolvers.removeById(),
    recipeRemoveOne: RecipeTC.mongooseResolvers.removeOne(),
    recipeRemoveMany: RecipeTC.mongooseResolvers.removeMany(),
};
