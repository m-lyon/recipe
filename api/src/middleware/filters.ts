import { User } from '../models/User.js';

export const filterIsOwnerOrAdmin = () => (next) => async (rp) => {
    const admins = await User.find({ role: 'admin' });
    const user = rp.context.getUser();
    const authUsers = user ? [user, ...admins] : admins;
    rp.args.filter = {
        ...rp.args.filter,
        owner: { $in: authUsers.map((authUser) => authUser._id) },
    };
    return next(rp);
};

export const filterIsUnique = () => (next) => async (rp) => {
    rp.args.filter = {
        ...rp.args.filter,
        unique: true,
    };
    return next(rp);
};
