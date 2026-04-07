import passport from 'passport';
import { GraphQLLocalStrategy } from 'graphql-passport';

import { User } from '../models/User.js';

passport.use(new GraphQLLocalStrategy(User.authenticate()));
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());
