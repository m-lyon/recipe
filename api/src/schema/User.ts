import { sendEmail } from '../utils/email.js';
import { User, UserTC } from '../models/User.js';
import { SMTP_ADMIN_EMAIL, SMTP_FROM_DOMAIN, TEST } from '../constants.js';

UserTC.addResolver({
    name: 'currentUser',
    description: 'Retrieve the currently authenticated user',
    type: UserTC,
    resolve: ({ context }) => {
        const user = context.getUser();
        return user;
    },
});

UserTC.addResolver({
    name: 'login',
    description: 'Login a user',
    type: UserTC,
    args: { username: 'String!', password: 'String!' },
    resolve: async ({ args, context }) => {
        if (context.isAuthenticated()) {
            return context.getUser();
        }
        const { user, info } = await context.authenticate('graphql-local', {
            username: args.username,
            password: args.password,
        });
        if (!user) {
            return info;
        }
        await context.login(user);
        return user;
    },
});
UserTC.addResolver({
    name: 'logout',
    description: 'Logout a user',
    type: 'Boolean!',
    resolve: async ({ context }) => {
        await context.logout();
        return true;
    },
});
UserTC.addResolver({
    name: 'register',
    description: 'Register a new user',
    type: UserTC,
    args: { username: 'String!', password: 'String!', firstName: 'String!', lastName: 'String!' },
    resolve: async ({ args, context }) => {
        const user = await User.register(
            new User({
                username: args.username,
                firstName: args.firstName,
                lastName: args.lastName,
                role: 'unverified',
            }),
            args.password
        );
        if (!TEST) {
            const text = `Please verify the user:
            Username: ${args.username}
            First Name: ${args.firstName}
            Last Name: ${args.lastName}`;
            sendEmail(`noreply@${SMTP_FROM_DOMAIN}`, SMTP_ADMIN_EMAIL, 'Verify User', text).catch(
                (error) => {
                    console.error('Failed to send verification email:', error);
                }
            );
        }
        await context.login(user);
        return user;
    },
});

export const UserQuery = {
    currentUser: UserTC.getResolver('currentUser'),
};

export const UserMutation = {
    login: UserTC.getResolver('login'),
    logout: UserTC.getResolver('logout'),
    register: UserTC.getResolver('register'),
};
