import passport from 'passport';
import { GraphQLLocalStrategy } from 'graphql-passport';

import { User } from '../models/User.js';

const authenticate = User.authenticate();

passport.use(
    new GraphQLLocalStrategy((username, password, done) =>
        authenticate(username as string, password as string, done)
    )
);
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());
