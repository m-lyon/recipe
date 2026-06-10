import { ResolverNextRpCb } from 'graphql-compose';

import { User } from '../models/User.js';
import { GraphQLContext } from '../types.js';

export const filterIsOwnerOrAdmin =
    (): ResolverNextRpCb<unknown, GraphQLContext> => (next) => async (rp) => {
        const admins = await User.find({ role: 'admin' });
        const user = rp.context.getUser();
        const authUsers = user ? [user, ...admins] : admins;
        rp.args.filter = {
            ...rp.args.filter,
            owner: { $in: authUsers.map((authUser) => authUser._id) },
        };
        return next(rp);
    };

export const filterIsUnique =
    (): ResolverNextRpCb<unknown, GraphQLContext> => (next) => async (rp) => {
        rp.args.filter = {
            ...rp.args.filter,
            unique: true,
        };
        return next(rp);
    };
