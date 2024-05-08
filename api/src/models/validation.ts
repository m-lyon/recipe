import { Types } from 'mongoose';

import { User } from './User.js';
import { Recipe } from './Recipe.js';
import { Tag } from './Tag.js';

export function uniqueInAdminsAndUser(model: string, attribute: string, message?: string) {
    async function validator(value: string) {
        const owner = this.owner;
        const admins = await User.find({ role: 'admin' });
        const count = await this.model(model).countDocuments({
            $and: [
                { $or: [{ owner }, { owner: { $in: admins } }] },
                { _id: { $ne: this._id } }, // Exclude the current document
                { [attribute]: value },
            ],
        });
        return count === 0;
    }
    return { validator, message: message ? message : `The ${model} ${attribute} must be unique.` };
}

export function unique(model: string, attribute: string) {
    async function validator(value: string) {
        if (this._id) {
            const count = await this.model(model).countDocuments({
                $and: [
                    { _id: { $ne: this._id } }, // Exclude the current document
                    { [attribute]: value },
                ],
            });
            return count === 0;
        }
        const count = await this.model(model).countDocuments({ [attribute]: value });
        return count === 0;
    }
    return { validator, message: `The ${attribute} must be unique, please try again.` };
}

export function ownerExists() {
    async function validator(owner: Types.ObjectId) {
        const user = await User.findById(owner);
        return user !== null;
    }
    return { validator, message: 'The owner must be a valid user.' };
}

export function recipeExists() {
    async function validator(recipe: Types.ObjectId) {
        const doc = await Recipe.findById(recipe);
        return doc !== null;
    }
    return { validator, message: 'Recipe does not exist.' };
}

export function tagsExist() {
    async function validator(tags: Types.ObjectId[]) {
        const count = await Tag.countDocuments({ _id: { $in: tags } });
        return count === tags.length;
    }
    return { validator, message: 'The tags must be valid tags.' };
}
