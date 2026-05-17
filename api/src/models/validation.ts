import { Types } from 'mongoose';

import { Tag } from './Tag.js';
import { User } from './User.js';
import { Unit } from './Unit.js';
import { Recipe } from './Recipe.js';

export function uniqueInAdminsAndUser(model: string, attribute: string, message?: string) {
    async function validator(value: string) {
        if (this.unique !== undefined && !this.unique) {
            return true;
        }
        const admins = await User.find({ role: 'admin' });
        const duplicates = await this.model(model).find({
            $and: [
                { $or: [{ owner: this.owner }, { owner: { $in: admins } }] },
                { _id: { $ne: this._id } },
                { $or: [{ unique: true }, { unique: { $exists: false } }] },
                { [attribute]: value },
            ],
        });

        // Vegan copies are allowed to share their original recipe's title
        if (this.originalRecipe != null) {
            const original = await this.model(model)
                .findOne({
                    _id: this.originalRecipe,
                    $or: [{ owner: this.owner }, { owner: { $in: admins } }],
                })
                .select(attribute);

            if (
                original?.get(attribute) === value &&
                duplicates.length === 1 &&
                String(duplicates[0]._id) === String(this.originalRecipe)
            ) {
                return true;
            }
        }

        if (this.veganVersion != null) {
            const existingDoc = this.isNew ? null : await this.model(model).findById(this._id);

            if (
                existingDoc?.get(attribute) === value &&
                duplicates.length === 1 &&
                String(duplicates[0]._id) === String(this.veganVersion)
            ) {
                return true;
            }
        }

        return duplicates.length === 0;
    }
    return {
        validator,
        message: message ? message : `The ${model.toLowerCase()} ${attribute} must be unique.`,
    };
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

export function unitExists() {
    async function validator(unit: Types.ObjectId) {
        const count = await Unit.countDocuments({ _id: unit });
        return count === 1;
    }
    return { validator, message: 'The unit must be valid.' };
}
