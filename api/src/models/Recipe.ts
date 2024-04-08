import { Document, Schema, Types, model } from 'mongoose';
import { composeMongoose } from 'graphql-compose-mongoose';

import { Unit } from './Unit.js';
import { Ingredient } from './Ingredient.js';
import { PrepMethod } from './PrepMethod.js';
import { generateRandomString } from '../utils/random.js';
import { ownerExists, tagsExist, unique, uniqueInAdminsAndUser } from './validation.js';

const quantityRegex = /^(?:(?:[+-]?\d+\.\d+)|(?:[+-]?\d+)|(?:[+-]?\d+\/[1-9]\d*))$/;

export interface RecipeIngredientType extends Document {
    ingredient: Types.ObjectId;
    type: 'ingredient' | 'recipe';
    quantity?: string;
    unit?: Types.ObjectId;
    prepMethod?: Types.ObjectId;
}

export function generateRecipeIdentifier(title: string): string {
    // Remove special characters
    let sanitizedTitle = title.replace(/[^a-zA-Z0-9\s]/g, '');
    // Remove leading and trailing whitespaces
    sanitizedTitle = sanitizedTitle.trim();
    // Replace spaces with dashes and convert to lowercase
    sanitizedTitle = sanitizedTitle.replace(/\s+/g, '-').toLowerCase();
    const suffix = generateRandomString(4);
    return `${sanitizedTitle}-${suffix}`;
}

const recipeIngredientSchema = new Schema<RecipeIngredientType>({
    ingredient: {
        type: Schema.Types.ObjectId,
        refPath: function () {
            return this.type === 'ingredient' ? 'Ingredient' : 'Recipe';
        },
        required: true,
        validate: {
            validator: function (ingredient: Types.ObjectId) {
                let type = this.type;
                if (!this.isNew) {
                    type = this.get('type');
                }
                if (type === 'ingredient') {
                    return Ingredient.exists({ _id: ingredient });
                } else {
                    return Recipe.exists({ _id: ingredient });
                }
            },
            message: 'Ingredient does not exist.',
        },
    },
    type: { type: String, enum: ['ingredient', 'recipe'], required: true },
    quantity: {
        type: String,
        validate: {
            validator: function (quantity: string) {
                if (quantity != null && !quantityRegex.test(quantity)) {
                    return false;
                }
                return true;
            },
            message: 'Invalid quantity format',
        },
    },
    unit: {
        type: Schema.Types.ObjectId,
        ref: 'Unit',
        validate: {
            validator: function (unit: Types.ObjectId) {
                if (unit != null) {
                    return Unit.exists({ _id: unit });
                }
                return true;
            },
            message: 'Unit does not exist.',
        },
    },
    prepMethod: {
        type: Schema.Types.ObjectId,
        ref: 'PrepMethod',
        validate: {
            validator: function (prepMethod: Types.ObjectId) {
                if (prepMethod != null) {
                    return PrepMethod.exists({ _id: prepMethod });
                }
                return true;
            },
            message: 'Prep method does not exist.',
        },
    },
});

export interface Recipe extends Document {
    title: string;
    titleIdentifier: string;
    pluralTitle?: string;
    subTitle?: string;
    tags?: Types.ObjectId[];
    ingredients: RecipeIngredientType[];
    instructions: string[];
    notes?: string;
    owner: Types.ObjectId;
    source?: string;
    numServings: number;
    isIngredient: boolean;
}

const recipeSchema = new Schema<Recipe>({
    title: {
        type: String,
        required: true,
        validate: {
            validator: uniqueInAdminsAndUser('Recipe', 'title'),
            message: 'The recipe title must be unique.',
        },
    },
    titleIdentifier: {
        type: String,
        required: true,
        validate: {
            validator: unique('Recipe', 'titleIdentifier'),
            message: 'The title identifier must be unique, please try again.',
        },
    },
    pluralTitle: { type: String },
    subTitle: { type: String },
    tags: {
        type: [{ type: Schema.Types.ObjectId, ref: 'Tag' }],
        validate: [
            tagsExist(),
            {
                validator: function (tags?: Types.ObjectId[]) {
                    if (tags) {
                        const uniqueTags = new Set(tags.map((tag) => tag.toString()));
                        return uniqueTags.size === tags.length;
                    }
                    return true;
                },
                message: 'Duplicate tags are not allowed.',
            },
        ],
    },
    ingredients: {
        type: [{ type: recipeIngredientSchema }],
        required: true,
        validate: {
            validator: function (ingredients: RecipeIngredientType[]) {
                return ingredients.length > 0;
            },
            message: 'At least one ingredient is required.',
        },
    },
    instructions: {
        type: [{ type: String }],
        required: true,
        validate: {
            validator: function (instructions: string[]) {
                return instructions.length > 0;
            },
            message: 'At least one instruction is required.',
        },
    },
    notes: { type: String },
    owner: { type: Schema.Types.ObjectId, required: true, ref: 'User', validator: ownerExists() },
    source: { type: String },
    numServings: { type: Number, required: true },
    isIngredient: { type: Boolean, required: true },
});

export const RecipeIngredient = model<RecipeIngredientType>(
    'RecipeIngredient',
    recipeIngredientSchema
);
export const RecipeIngredientTC = composeMongoose(RecipeIngredient);
export const Recipe = model<Recipe>('Recipe', recipeSchema);
export const RecipeModifyTC = composeMongoose(Recipe, {
    removeFields: ['titleIdentifier'],
    name: 'RecipeModify',
});
export const RecipeCreateTC = composeMongoose(Recipe, {
    removeFields: ['owner', 'titleIdentifier'],
    name: 'RecipeCreate',
});
export const RecipeQueryTC = composeMongoose(Recipe);
