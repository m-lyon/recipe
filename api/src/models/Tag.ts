import { Schema, Document, Types, model } from 'mongoose';
import { composeMongoose } from 'graphql-compose-mongoose';

export interface Tag extends Document {
    value: string;
}

const tagSchema = new Schema<Tag>({
    value: {
        type: String,
        required: true,
        unique: true,
        set: (value: string) => value.toLowerCase(),
    },
});

export const tagValidator = {
    validator: function (tags?: Types.ObjectId[]) {
        if (tags) {
            const uniqueTags = new Set(tags.map((tag) => tag.toString()));
            return uniqueTags.size === tags.length;
        }
        return true;
    },
    message: 'Duplicate tags are not allowed.',
};

export const Tag = model<Tag>('Tag', tagSchema);
export const TagTC = composeMongoose(Tag);
