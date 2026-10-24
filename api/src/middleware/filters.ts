import { ResolverNextRpCb } from 'graphql-compose';

import { User } from '../models/User.js';
import { GraphQLContext } from '../types.js';
import { unauthenticated } from './authorisation.js';

export const filterIsVisible =
    (): ResolverNextRpCb<unknown, GraphQLContext> => (next) => async (rp) => {
        const user = rp.context.getUser();
        if (user && user.role !== 'unverified') {
            return next(rp);
        }
        const admins = await User.find({ role: 'admin' });
        const authUsers = user ? [user, ...admins] : admins;
        rp.args.filter = {
            ...rp.args.filter,
            owner: { $in: authUsers.map((authUser) => authUser._id) },
        };
        return next(rp);
    };

export const filterIsEditable =
    (): ResolverNextRpCb<unknown, GraphQLContext> => (next) => async (rp) => {
        const user = rp.context.getUser();
        if (!user) {
            throw unauthenticated();
        }
        if (user.role !== 'admin') {
            rp.args.filter = { ...rp.args.filter, owner: user._id };
        }
        return next(rp);
    };

/**
 * Filters unique items.
 *
 * Hides throwaway units, sizes and prep methods (unique: false). The "use X as
 * unit/size/prep method" option creates these for a single recipe, so they are not shared
 * across recipes and are not listed or edited. To change one, the user deletes it and
 * makes a new one.
 */
export const filterIsUnique =
    (): ResolverNextRpCb<unknown, GraphQLContext> => (next) => async (rp) => {
        rp.args.filter = {
            ...rp.args.filter,
            unique: true,
        };
        return next(rp);
    };
