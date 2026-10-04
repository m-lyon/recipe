import { GraphQLNonNull } from 'graphql';
import { ResolverNextRpCb } from 'graphql-compose';

import { UnitTC } from '../models/Unit.js';
import { GraphQLContext } from '../types.js';
import { setRecordOwnerAsUser } from '../middleware/create.js';
import { notAuthorised } from '../middleware/authorisation.js';
import { createOneResolver, updateByIdResolver } from './utils.js';
import { DisplayLadder, DisplayLadderCreateTC, DisplayLadderTC } from '../models/DisplayLadder.js';

/** Global ladders change what every reader sees, so only an admin may create one. */
const onlyAdminsSetGlobalScope =
    (): ResolverNextRpCb<unknown, GraphQLContext> => (next) => async (rp) => {
        const user = rp.context.getUser();
        if (rp.args.record?.scope === 'global' && user?.role !== 'admin') {
            throw notAuthorised();
        }
        return next(rp);
    };

/** Readers see the global ladders and their own. */
const filterVisibleLadders =
    (): ResolverNextRpCb<unknown, GraphQLContext> => (next) => async (rp) => {
        const user = rp.context.getUser();
        const visible = user ? [{ scope: 'global' }, { owner: user._id }] : [{ scope: 'global' }];
        rp.beforeQuery = (query) => query.where({ $or: visible });
        return next(rp);
    };

DisplayLadderCreateTC.addResolver({
    name: 'createOne',
    description: 'Create a new display ladder',
    type: DisplayLadderTC.mongooseResolvers.createOne().getType(),
    args: DisplayLadderCreateTC.mongooseResolvers.createOne().getArgs(),
    resolve: createOneResolver(DisplayLadder, DisplayLadderCreateTC),
});

DisplayLadderTC.addResolver({
    name: 'updateById',
    description: 'Update a display ladder by its ID',
    type: DisplayLadderTC.mongooseResolvers.updateById().getType(),
    args: DisplayLadderTC.mongooseResolvers.updateById().getArgs(),
    resolve: updateByIdResolver(DisplayLadder, DisplayLadderTC),
});

const DisplayLadderStepTC = DisplayLadderTC.getFieldOTC('steps');
DisplayLadderStepTC.addRelation('unit', {
    resolver: () => UnitTC.mongooseResolvers.findById(),
    prepareArgs: { _id: (source: { unit: unknown }) => source.unit },
    projection: { unit: true },
});
DisplayLadderStepTC.extendField('unit', { type: new GraphQLNonNull(UnitTC.getType()) });

export const DisplayLadderQuery = {
    displayLadderMany: DisplayLadderTC.mongooseResolvers
        .findMany()
        .wrapResolve(filterVisibleLadders())
        .setDescription('Retrieve the global display ladders and those of the current user'),
};

export const DisplayLadderMutation = {
    displayLadderCreateOne: DisplayLadderCreateTC.getResolver('createOne')
        .wrapResolve(setRecordOwnerAsUser())
        .wrapResolve(onlyAdminsSetGlobalScope()),
    displayLadderUpdateById: DisplayLadderTC.getResolver('updateById').wrapResolve(
        onlyAdminsSetGlobalScope()
    ),
    displayLadderRemoveById: DisplayLadderTC.mongooseResolvers
        .removeById()
        .setDescription('Remove a display ladder by its ID'),
};
