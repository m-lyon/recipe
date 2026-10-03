import type { Types } from 'mongoose';
import type { PassportContext } from 'graphql-passport';
import type { ResolverResolveParams } from 'graphql-compose';

import type { User } from './models/User.js';

/**
 * Minimal shape of an image stored on the request context by isImageOwnerOrAdmin middleware.
 * The runtime value is a hydrated Image document with recipe populated, but the context only
 * relies on this structural subset.
 */
export type ContextImage = {
    _id: Types.ObjectId;
    origUrl: string;
    recipe: {
        _id: Types.ObjectId;
        owner: Types.ObjectId;
    };
};

/**
 * GraphQL request context: passport auth helpers + optional image cache set by middleware.
 */
export interface GraphQLContext
    extends PassportContext<User, { username: string; password: string }> {
    images?: ContextImage[];
}

/**
 * Resolve params for resolvers added with `TC.addResolver`, which can't infer them because it
 * accepts either a Resolver or a resolver definition.
 */
export type ResolveParams<TArgs = Record<string, never>> = ResolverResolveParams<
    unknown,
    GraphQLContext,
    TArgs
>;
