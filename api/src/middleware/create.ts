import { ResolverNextRpCb } from 'graphql-compose';

import { GraphQLContext } from '../types.js';

export const setRecordOwnerAsUser =
    (): ResolverNextRpCb<unknown, GraphQLContext> => (next) => async (rp) => {
        rp.args.record.owner = rp.context.getUser();
        return next(rp);
    };
