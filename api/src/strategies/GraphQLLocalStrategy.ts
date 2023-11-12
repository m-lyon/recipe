import passport from 'passport';
import { User } from '../models/User.js';
import { GraphQLLocalStrategy } from 'graphql-passport';

passport.use(new GraphQLLocalStrategy(User.authenticate()));
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());
