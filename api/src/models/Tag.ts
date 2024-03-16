import { Schema, Document, Types, model } from 'mongoose';
import { composeMongoose } from 'graphql-compose-mongoose';
import { uniqueInAdminsAndUser } from '../middleware/validation.js';

export interface Tag extends Document {
    value: string;
}

const tagSchema = new Schema<Tag>({
    value: {
        type: String,
        required: true,
        validate: {
            validator: uniqueInAdminsAndUser('Tag', 'value'),
            message: 'The tag must be unique.',
        },
        set: (value: string) => value.toLowerCase(),
    },
});

export const Tag = model<Tag>('Tag', tagSchema);
export const TagTC = composeMongoose(Tag);
