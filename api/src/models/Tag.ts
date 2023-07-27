import { Schema, Document, Types, model } from 'mongoose';

export interface Tag extends Document {
    name: string;
}

const tagSchema = new Schema<Tag>({
    name: { type: String, required: true, unique: true },
});

export const Tag = model<Tag>('Tag', tagSchema);

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
