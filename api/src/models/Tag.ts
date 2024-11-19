import { Document, Schema, model } from 'mongoose';
import { composeMongoose } from 'graphql-compose-mongoose';

import { ReservedRecipeTags } from './Recipe.js';
import { uniqueInAdminsAndUser } from './validation.js';
import { ReservedIngredientTags } from './Ingredient.js';

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
                validator: (value: string) => {
                    const reservedIngredientTags = Object.values(
                        ReservedIngredientTags
                    ) satisfies string[] as string[];
                    const reservedRecipeTags = Object.values(
                        ReservedRecipeTags
                    ) satisfies string[] as string[];
                    return (
                        !reservedIngredientTags.includes(value) &&
                        !reservedRecipeTags.includes(value)
                    );
                },
                message: 'Forbidden tag.',
            },
        ],
        set: (value: string) => value.toLowerCase(),
    },
});

export const Tag = model<Tag>('Tag', tagSchema);
export const TagTC = composeMongoose(Tag);
