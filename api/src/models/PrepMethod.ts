import { Document, Schema, Types, model } from 'mongoose';
import { composeMongoose } from 'graphql-compose-mongoose';

import { ownerExists, uniqueInAdminsAndUser } from './validation.js';

export interface PrepMethod extends Document {
    value: string;
    owner: Types.ObjectId;
}

const prepMethodSchema = new Schema<PrepMethod>({
    value: {
        type: String,
        required: true,
        validate: {
            validator: uniqueInAdminsAndUser('PrepMethod', 'value'),
            message: 'The prep method must be unique.',
        },
    },
    owner: { type: Schema.Types.ObjectId, ref: 'User', required: true, validator: ownerExists() },
});

export const PrepMethod = model<PrepMethod>('PrepMethod', prepMethodSchema);
export const PrepMethodTC = composeMongoose(PrepMethod);
export const PrepMethodCreateTC = composeMongoose(PrepMethod, {
    removeFields: ['owner'],
    name: 'PrepMethodCreate',
});
