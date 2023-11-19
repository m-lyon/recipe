import { UnitTC } from '../models/Unit.js';

export const UnitQuery = {
    unitById: UnitTC.mongooseResolvers.findById(),
    unitByIds: UnitTC.mongooseResolvers.findByIds(),
    unitOne: UnitTC.mongooseResolvers.findOne(),
    unitMany: UnitTC.mongooseResolvers.findMany(),
    // unitDataLoader: UnitTC.mongooseResolvers.dataLoader(),
    // unitDataLoaderMany: UnitTC.mongooseResolvers.dataLoaderMany(),
    // unitCount: UnitTC.mongooseResolvers.count(),
    // unitConnection: UnitTC.mongooseResolvers.connection(),
    // unitPagination: UnitTC.mongooseResolvers.pagination(),
};

export const UnitMutation = {
    unitCreateOne: UnitTC.mongooseResolvers.createOne(),
    unitUpdateById: UnitTC.mongooseResolvers.updateById(),
    unitUpdateOne: UnitTC.mongooseResolvers.updateOne(),
    unitRemoveById: UnitTC.mongooseResolvers.removeById(),
    unitRemoveOne: UnitTC.mongooseResolvers.removeOne(),
};
