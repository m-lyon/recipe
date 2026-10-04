import { GraphQLNonNull } from 'graphql';
import { schemaComposer } from 'graphql-compose';

import { SizeTC } from '../models/Size.js';
import { UnitTC } from '../models/Unit.js';
import { PrepMethodTC } from '../models/PrepMethod.js';
import { createOneResolver, updateByIdResolver } from './utils.js';
import { IngredientMeasure, IngredientMeasureTC } from '../models/IngredientMeasure.js';

IngredientMeasureTC.addResolver({
    name: 'createOne',
    description: 'Record the weight of one unit of an ingredient',
    type: IngredientMeasureTC.mongooseResolvers.createOne().getType(),
    args: IngredientMeasureTC.mongooseResolvers.createOne().getArgs(),
    resolve: createOneResolver(IngredientMeasure, IngredientMeasureTC),
});

IngredientMeasureTC.addResolver({
    name: 'updateById',
    description: 'Update an ingredient measure by its ID',
    type: IngredientMeasureTC.mongooseResolvers.updateById().getType(),
    args: IngredientMeasureTC.mongooseResolvers.updateById().getArgs(),
    resolve: updateByIdResolver(IngredientMeasure, IngredientMeasureTC),
});

IngredientMeasureTC.addRelation('unit', {
    resolver: () => UnitTC.mongooseResolvers.findById(),
    prepareArgs: { _id: (source) => source.unit },
    projection: { unit: true },
});
IngredientMeasureTC.extendField('unit', { type: new GraphQLNonNull(UnitTC.getType()) });
IngredientMeasureTC.addRelation('size', {
    resolver: () => SizeTC.mongooseResolvers.findById(),
    prepareArgs: { _id: (source) => source.size },
    projection: { size: true },
});
IngredientMeasureTC.addRelation('prepMethod', {
    resolver: () => PrepMethodTC.mongooseResolvers.findById(),
    prepareArgs: { _id: (source) => source.prepMethod },
    projection: { prepMethod: true },
});

export const IngredientMeasureQuery = {
    ingredientMeasuresByIngredientIds: schemaComposer.createResolver({
        name: 'ingredientMeasuresByIngredientIds',
        type: [IngredientMeasureTC.NonNull],
        args: { ingredientIds: '[MongoID!]!' },
        resolve: async ({ args }) => {
            return IngredientMeasure.find({ ingredient: { $in: args.ingredientIds } });
        },
    }),
};

export const IngredientMeasureMutation = {
    ingredientMeasureCreateOne: IngredientMeasureTC.getResolver('createOne'),
    ingredientMeasureUpdateById: IngredientMeasureTC.getResolver('updateById'),
    ingredientMeasureRemoveById: IngredientMeasureTC.mongooseResolvers
        .removeById()
        .setDescription('Remove an ingredient measure by its ID'),
};
