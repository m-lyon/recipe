import { User, UserTC } from '../models/User.js';

UserTC.addResolver({
    name: 'currentUser',
    type: UserTC,
    resolve: ({ source, args, context }) => context.getUser(),
});

export const UserQuery = {
    currentUser: UserTC.getResolver('currentUser'),
};

UserTC.addResolver({
    name: 'login',
    type: UserTC,
    args: { username: 'String!', password: 'String!' },
    resolve: async ({ source, args, context }) => {
        const { user, info } = await context.authenticate('graphql-local', {
            username: args.username,
            password: args.password,
        });

        // await context.login(user);
        return user;
    },
});
UserTC.addResolver({
    name: 'logout',
    type: UserTC,
    resolve: ({ source, args, context }) => {
        // await context.logout();
        return null;
    },
});
UserTC.addResolver({
    name: 'register',
    type: UserTC,
    args: { username: 'String!', password: 'String!', firstName: 'String!', lastName: 'String!' },
    resolve: async ({ source, args, context }) => {
        const user = await User.register(
            new User({
                username: args.username,
                firstName: args.firstName,
                lastName: args.lastName,
                role: 'user',
            }),
            args.password
        );

        // await context.login(user);
        return user;
    },
});

export const UserMutation = {
    login: UserTC.getResolver('login'),
    logout: UserTC.getResolver('logout'),
    register: UserTC.getResolver('register'),
};
