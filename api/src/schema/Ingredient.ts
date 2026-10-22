import { OwnerTC } from '../models/User.js';
import { validateItemNotInRecipe } from './validation.js';
import { setRecordOwnerAsUser } from '../middleware/create.js';
import { IngredientMeasure } from '../models/IngredientMeasure.js';
import { createOneResolver, updateByIdResolver } from './utils.js';
import { filterIsEditable, filterIsVisible } from '../middleware/filters.js';
import { Ingredient, IngredientCreateTC, IngredientTC } from '../models/Ingredient.js';

IngredientTC.addRelation('owner', {
    resolver: () => OwnerTC.getResolver('findById'),
    prepareArgs: { _id: (source) => source.owner },
    projection: { owner: true },
});

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
        .wrapResolve(filterIsVisible())
        .setDescription('Retrieve multiple ingredients'),
    ingredientManyEditable: IngredientTC.mongooseResolvers
        .findMany()
        .wrapResolve(filterIsEditable())
        .setDescription('Retrieve the ingredients the current user can edit'),
};

export const IngredientQueryAdmin = {
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
        .setDescription('Remove an ingredient by its ID')
        .wrapResolve((next) => async (rp) => {
            await validateItemNotInRecipe(rp.args._id, 'ingredient');
            const result = await next(rp);
            await IngredientMeasure.deleteMany({ ingredient: rp.args._id });
            return result;
        }),
};
