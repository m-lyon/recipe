import { Document, Schema, model } from 'mongoose';
import { composeMongoose } from 'graphql-compose-mongoose';
import passportLocalMongoose from 'passport-local-mongoose';

export interface User extends Document {
    firstName: string;
    lastName: string;
    role: 'admin' | 'user' | 'unverified';
}

const userSchema = new Schema<User>({
    firstName: { type: String, required: true },
    lastName: { type: String, required: true },
    role: { type: String, enum: ['admin', 'user', 'unverified'], required: true },
});

userSchema.plugin(passportLocalMongoose);

export const User = model<User>('User', userSchema);
export const UserTC = composeMongoose(User, { removeFields: ['salt', 'hash'] });
