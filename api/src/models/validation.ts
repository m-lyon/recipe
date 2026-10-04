import { Document, Types } from 'mongoose';

import { Tag } from './Tag.js';
import { User } from './User.js';
import { Unit } from './Unit.js';
import { Recipe } from './Recipe.js';

/**
 * A document that can query its own collection, which is all `unique` needs.
 */
type QueryableDoc = Pick<Document<Types.ObjectId>, '_id' | 'model'>;

/**
 * A document owned by a user, so uniqueness can be scoped to the owner and the admins.
 */
type OwnedDoc = QueryableDoc & { owner: Types.ObjectId };

/**
 * An owned document that may opt out of uniqueness. Models without a `unique` field are always
 * checked.
 */
type ScopedUniqueDoc = OwnedDoc & { unique?: boolean };

/**
 * A field declared on the model itself, rather than one inherited from `Document`.
 */
type ModelField<TDoc> = Exclude<keyof TDoc, keyof Document> & string;

async function findDuplicatesInAdminsAndUserScope(
    doc: OwnedDoc,
    model: string,
    attribute: string,
    value: string
) {
    const admins = await User.find({ role: 'admin' });
    const duplicates = await doc.model(model).find({
        $and: [
            { $or: [{ owner: doc.owner }, { owner: { $in: admins } }] },
            { _id: { $ne: doc._id } },
            { $or: [{ unique: true }, { unique: { $exists: false } }] },
            { [attribute]: value },
        ],
    });

    return { admins, duplicates };
}

/**
 * Mongoose doesn't type a validator's `this`, so callers name the model, e.g.
 * `uniqueInAdminsAndUser<Unit>('Unit', 'shortSingular')`, to check it has the fields used here.
 */
export function uniqueInAdminsAndUser<TDoc extends ScopedUniqueDoc>(
    model: string,
    attribute: ModelField<TDoc>,
    message?: string
) {
    async function validator(this: TDoc, value: string) {
        if (this.unique === false) {
            return true;
        }
        const { duplicates } = await findDuplicatesInAdminsAndUserScope(
            this,
            model,
            attribute,
            value
        );

        return duplicates.length === 0;
    }
    return {
        validator,
        message: message ? message : `The ${model.toLowerCase()} ${attribute} must be unique.`,
    };
}

export function uniqueRecipeTitleInAdminsAndUser(message?: string) {
    async function validator(this: Recipe, value: string) {
        const { admins, duplicates } = await findDuplicatesInAdminsAndUserScope(
            this,
            'Recipe',
            'title',
            value
        );

        if (this.originalRecipe != null) {
            const original = await this.model('Recipe')
                .findOne({
                    _id: this.originalRecipe,
                    $or: [{ owner: this.owner }, { owner: { $in: admins } }],
                })
                .select('title');

            if (
                original?.get('title') === value &&
                duplicates.length === 1 &&
                String(duplicates[0]._id) === String(this.originalRecipe)
            ) {
                return true;
            }
        }

        if (this.veganVersion != null) {
            const existingDoc = this.isNew ? null : await this.model('Recipe').findById(this._id);

            if (
                existingDoc?.get('title') === value &&
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
        message: message ? message : 'The recipe title must be unique.',
    };
}

export function unique<TDoc extends QueryableDoc>(
    model: string,
    attribute: ModelField<TDoc>,
    message?: string
) {
    async function validator(this: TDoc, value: string) {
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
    return { validator, message: message ?? `The ${attribute} must be unique, please try again.` };
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
