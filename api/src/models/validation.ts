import { Types } from 'mongoose';

import { User } from './User.js';
import { Recipe } from './Recipe.js';
import { Tag } from './Tag.js';

// Validators need to be functions that return a promise, rather than async functions
// Because of graphql-compose-mongoose internal validation calls use validateSync calls
// which silently skip async validators

export function uniqueInAdminsAndUser(model: string, attribute: string, message?: string) {
    function validator(value: string) {
        return User.find({ role: 'admin' })
            .then((admins) => {
                return this.model(model).countDocuments({
                    $and: [
                        { $or: [{ owner: this.owner }, { owner: { $in: admins } }] },
                        { _id: { $ne: this._id } }, // Exclude the current document
                        { [attribute]: value },
                    ],
                });
            })
            .then((count) => count === 0);
    }
    return { validator, message: message ? message : `The ${model} ${attribute} must be unique.` };
}

export function unique(model: string, attribute: string) {
    function validator(value: string) {
        return this.model(model)
            .countDocuments({
                $and: [
                    { _id: { $ne: this._id } }, // Exclude the current document
                    { [attribute]: value },
                ],
            })
            .then((count) => count === 0);
    }

    return { validator, message: `The ${attribute} must be unique, please try again.` };
}

export function ownerExists() {
    function validator(owner: Types.ObjectId) {
        return User.findById(owner).then((user) => user !== null);
    }
    return { validator, message: 'The owner must be a valid user.' };
}

export function recipeExists() {
    function validator(recipe: Types.ObjectId) {
        return Recipe.findById(recipe).then((recipeDoc) => recipeDoc !== null);
    }
    return { validator, message: 'The recipe must be a valid recipe.' };
}

export function tagsExist() {
    function validator(tags: Types.ObjectId[]) {
        return Tag.countDocuments({ _id: { $in: tags } }).then((count) => count === tags.length);
    }
    return { validator, message: 'The tags must be valid tags.' };
}
