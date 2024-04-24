import { Document, Model } from 'mongoose';
import { ObjectTypeComposer } from 'graphql-compose';
import { findById } from 'graphql-compose-mongoose/lib/resolvers/findById.js';

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
                `${tc.getTypeName()}.updateById resolver doesn't receive new data in args.record`
            );
        }

        doc.set(recordData);
        await doc.save();

        return { record: doc };
    };
    return resolve;
}
