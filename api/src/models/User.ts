import { Schema, Document, model } from 'mongoose';

export interface IUser extends Document {
    name: string;
    isAdmin: boolean;
}

const userSchema = new Schema<IUser>({
    name: { type: String, required: true },
    isAdmin: { type: Boolean, required: true },
});

export const User = model<IUser>('User', userSchema);
