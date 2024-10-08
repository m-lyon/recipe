import { Document, Schema, model } from 'mongoose';
import { composeMongoose } from 'graphql-compose-mongoose';

import { ALLOWED_TAGS } from './Ingredient.js';
import { uniqueInAdminsAndUser } from './validation.js';

export interface Tag extends Document {
    value: string;
}

const tagSchema = new Schema<Tag>({
    value: {
        type: String,
        required: true,
        validate: [
            uniqueInAdminsAndUser('Tag', 'value', 'The tag must be unique.'),
            {
                validator: (value: string) => ![...ALLOWED_TAGS].includes(value.toLowerCase()),
                message: 'Forbidden tag.',
            },
        ],
        set: (value: string) => value.toLowerCase(),
    },
});

export const Tag = model<Tag>('Tag', tagSchema);
export const TagTC = composeMongoose(Tag);
