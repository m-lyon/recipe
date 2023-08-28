import { Schema, Document, model } from 'mongoose';
import { composeMongoose } from 'graphql-compose-mongoose';

export interface PrepMethod extends Document {
    value: string;
}

const prepMethodSchema = new Schema<PrepMethod>({
    value: { type: String, required: true, unique: true },
});

export const PrepMethod = model<PrepMethod>('PrepMethod', prepMethodSchema);
export const PrepMethodTC = composeMongoose(PrepMethod);
