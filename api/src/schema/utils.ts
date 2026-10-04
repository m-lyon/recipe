import { GraphQLError } from 'graphql';
import { ApolloServerErrorCode } from '@apollo/server/errors';
import { Document, Model, Error as MongooseError } from 'mongoose';
import { ObjectTypeComposer, ResolverResolveParams } from 'graphql-compose';
import { findById } from 'graphql-compose-mongoose/lib/resolvers/findById.js';

// Mongoose sets `_message` (e.g. "Recipe validation failed") but doesn't declare it
type ValidationError = MongooseError.ValidationError & { _message: string };

export async function validateDoc(doc: Document) {
    try {
        await doc.validate();
    } catch (errors) {
        if (!(errors instanceof MongooseError.ValidationError)) {
            throw errors;
        }
        const { _message, errors: fieldErrors } = errors as ValidationError;
        const errorList = Object.keys(fieldErrors).map((key) => {
            const { message, value, path } = fieldErrors[key];
            return { path, message, value };
        });
        // Just show the first error, if more than one, otherwise formatting is too verbose
        const error = errorList[0];
        throw new GraphQLError(`${_message}: ${error.path}: ${error.message}`, {
            extensions: {
                code: ApolloServerErrorCode.GRAPHQL_VALIDATION_FAILED,
                value: error.value,
            },
        });
    }
}

type MutationResolveParams<TArgs> = ResolverResolveParams<unknown, unknown, TArgs>;

export function createOneResolver<TDoc extends Document>(
    model: Model<TDoc>,
    tc: ObjectTypeComposer<TDoc>
) {
    const resolve = async (rp: MutationResolveParams<{ record?: Record<string, unknown> }>) => {
        const recordData = rp?.args?.record;

        if (!(typeof recordData === 'object') || Object.keys(recordData).length === 0) {
            throw new Error(
                `${tc.getTypeName()}.createOne resolver requires at least one value in args.record`
            );
        }

        let doc = new model(recordData);
        if (rp.beforeRecordMutate) {
            doc = await rp.beforeRecordMutate(doc, rp);
            if (!doc) return null;
        }

        await validateDoc(doc);
        await doc.save({ validateBeforeSave: false });

        return { record: doc };
    };
    return resolve;
}

export function updateByIdResolver<TDoc extends Document>(
    model: Model<TDoc>,
    tc: ObjectTypeComposer<TDoc>
) {
    const findByIdResolver = findById(model, tc);
    const resolve = async (
        rp: MutationResolveParams<{ record?: Record<string, unknown>; _id: string }>
    ) => {
        const recordData = rp?.args?.record;

        if (!(typeof recordData === 'object')) {
            throw new Error(`${tc.getTypeName()}.updateById resolver requires args.record value`);
        }
        if (!rp?.args?._id) {
            throw new Error(`${tc.getTypeName()}.updateById resolver requires args._id value`);
        }

        // We should get all data for document, because Mongoose model may have hooks/middlewares
        // which required some fields which not in graphql projection
        // So empty projection returns all fields.
        let doc = await findByIdResolver.resolve({ ...rp, projection: {} });

        if (rp.beforeRecordMutate) {
            doc = await rp.beforeRecordMutate(doc, rp);
        }

        if (!doc) {
            throw new Error('Document not found');
        }

        if (!recordData) {
            throw new Error(
                `${tc.getTypeName()}.updateById resolver didn't receive new data in args.record`
            );
        }
        doc.set(recordData);
        await validateDoc(doc);
        await doc.save({ validateBeforeSave: false });
        return { record: doc };
    };
    return resolve;
}
