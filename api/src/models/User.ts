import { Schema, Document, model } from 'mongoose';

export interface User extends Document {
    name: string;
    isAdmin: boolean;
}

const userSchema = new Schema<User>({
    name: { type: String, required: true },
    isAdmin: { type: Boolean, required: true },
});

export const User = model<User>('User', userSchema);
