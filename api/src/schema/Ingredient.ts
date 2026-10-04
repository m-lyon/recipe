import { Unit } from '../models/Unit.js';
import { GraphQLContext } from '../types.js';
import { validateItemNotInRecipe } from './validation.js';
import { IngredientMeasure } from '../models/IngredientMeasure.js';
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

/**
 * The ids of every ingredient with a count measure, loaded once per request: an ingredient
 * list resolves `isCountable` for every row.
 */
const countableIngredientIds = new WeakMap<object, Promise<Set<string>>>();
function getCountableIngredientIds(context: GraphQLContext): Promise<Set<string>> {
    let ids = countableIngredientIds.get(context);
    if (!ids) {
        ids = (async () => {
            const countUnits = await Unit.find({ dimension: 'count' }).distinct('_id');
            const ingredients = await IngredientMeasure.find({
                unit: { $in: countUnits },
            }).distinct('ingredient');
            return new Set(ingredients.map(String));
        })();
        countableIngredientIds.set(context, ids);
    }
    return ids;
}

// Derived, not stored: an ingredient is countable when it has a count measure.
IngredientTC.addFields({
    isCountable: {
        type: 'Boolean!',
        description: 'True when the ingredient has a measure in a count unit, e.g. 1 each',
        projection: { _id: true },
        resolve: async (source, _args, context: GraphQLContext) => {
            const ids = await getCountableIngredientIds(context);
            return ids.has(String(source._id));
        },
    },
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
        .setDescription('Remove an ingredient by its ID')
        .wrapResolve((next) => async (rp) => {
            await validateItemNotInRecipe(rp.args._id, 'ingredient');
            const result = await next(rp);
            await IngredientMeasure.deleteMany({ ingredient: rp.args._id });
            return result;
        }),
};
