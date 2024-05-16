import { Document, Model } from 'mongoose';
import { ObjectTypeComposer } from 'graphql-compose';
import { findById } from 'graphql-compose-mongoose/lib/resolvers/findById.js';
import { ApolloServerErrorCode } from '@apollo/server/errors';
import { GraphQLError } from 'graphql';

export async function validateDoc(doc: Document) {
    try {
        await doc.validate();
    } catch (errors) {
        const errorList = Object.keys(errors.errors).map((key) => {
            const { message, value, path } = errors.errors[key];
            return { path, message, value };
        });
        // Just show the first error, if more than one, otherwise formatting is too verbose
        const error = errorList[0];
        throw new GraphQLError(`${errors._message}: ${error.path}: ${error.message}`, {
            extensions: {
                code: ApolloServerErrorCode.GRAPHQL_VALIDATION_FAILED,
                value: error.value,
            },
        });
    }
}

export function createOneResolver<TDoc extends Document>(
    model: Model<TDoc>,
    tc: ObjectTypeComposer<TDoc>
) {
    const resolve = async (rp) => {
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
    const resolve = async (rp) => {
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
