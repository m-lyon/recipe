import { Document, Schema, Types, model } from 'mongoose';
import { composeMongoose } from 'graphql-compose-mongoose';

import { ownerExists, uniqueInAdminsAndUser } from './validation.js';

export interface PrepMethod extends Document {
    value: string;
    unique: boolean;
    owner: Types.ObjectId;
}

const prepMethodSchema = new Schema<PrepMethod>({
    value: {
        type: String,
        required: true,
        validate: uniqueInAdminsAndUser('PrepMethod', 'value', 'The prep method must be unique.'),
    },
    unique: { type: Boolean, required: true },
    owner: { type: Schema.Types.ObjectId, ref: 'User', required: true, validate: ownerExists() },
});

export const PrepMethod = model<PrepMethod>('PrepMethod', prepMethodSchema);
export const PrepMethodTC = composeMongoose(PrepMethod);
export const PrepMethodCreateTC = composeMongoose(PrepMethod, {
    removeFields: ['owner'],
    name: 'PrepMethodCreate',
});
