import { Schema, Document, model, Types } from 'mongoose';
import { composeMongoose } from 'graphql-compose-mongoose';

export interface PrepMethod extends Document {
    value: string;
    owner: Types.ObjectId;
}

const prepMethodSchema = new Schema<PrepMethod>({
    value: { type: String, required: true, unique: true },
    owner: { type: Schema.Types.ObjectId, ref: 'User', required: true },
});

export const PrepMethod = model<PrepMethod>('PrepMethod', prepMethodSchema);
export const PrepMethodTC = composeMongoose(PrepMethod);
