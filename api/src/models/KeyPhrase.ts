import { Document, Schema, model } from 'mongoose';
import { composeMongoose } from 'graphql-compose-mongoose';

export interface KeyPhrase extends Document {
    value: string;
    description: string;
}

const keyPhraseSchema = new Schema<KeyPhrase>(
    {
        value: {
            type: String,
            required: true,
            unique: true,
            set: (v: string) => v.toLowerCase(),
        },
        description: {
            type: String,
            required: true,
        },
    },
    { timestamps: true }
);

export const KeyPhrase = model<KeyPhrase>('KeyPhrase', keyPhraseSchema);
export const KeyPhraseTC = composeMongoose(KeyPhrase);
