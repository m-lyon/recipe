import { UnitTC } from '../models/Unit.js';

export const UnitQuery = {
    unitById: UnitTC.mongooseResolvers.findById(),
    unitByIds: UnitTC.mongooseResolvers.findByIds(),
    unitOne: UnitTC.mongooseResolvers.findOne(),
    unitMany: UnitTC.mongooseResolvers.findMany(),
};

export const UnitMutation = {
    unitCreateOne: UnitTC.mongooseResolvers.createOne(),
    unitUpdateById: UnitTC.mongooseResolvers.updateById(),
    unitUpdateOne: UnitTC.mongooseResolvers.updateOne(),
    unitRemoveById: UnitTC.mongooseResolvers.removeById(),
    unitRemoveOne: UnitTC.mongooseResolvers.removeOne(),
};
