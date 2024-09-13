import { Document, Schema, Types, model } from 'mongoose';
import { composeMongoose } from 'graphql-compose-mongoose';

import { ownerExists, uniqueInAdminsAndUser } from './validation.js';

export interface Size extends Document {
    value: string;
    unique: boolean;
    owner: Types.ObjectId;
}

const sizeSchema = new Schema<Size>({
    value: {
        type: String,
        required: true,
        validate: uniqueInAdminsAndUser('Size', 'value', 'The size must be unique.'),
    },
    unique: { type: Boolean, required: true },
    owner: { type: Schema.Types.ObjectId, ref: 'User', required: true, validate: ownerExists() },
});

export const Size = model<Size>('Size', sizeSchema);
export const SizeTC = composeMongoose(Size);
export const SizeCreateTC = composeMongoose(Size, {
    removeFields: ['owner'],
    name: 'SizeCreate',
});
