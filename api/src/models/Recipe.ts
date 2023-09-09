import { Schema, Document, model, Types } from 'mongoose';
import { composeMongoose } from 'graphql-compose-mongoose';

import { User } from './User.js';
import { Unit } from './Unit.js';
import { Ingredient } from './Ingredient.js';
import { PrepMethod } from './PrepMethod.js';
import { Tag, tagValidator } from './Tag.js';
import { Cuisine, cuisineValidator } from './Cuisine.js';
import { validateMongooseObjectIds, validateMongooseObjectIdsArray } from './utils.js';

export interface RecipeIngredient extends Document {
    ingredient: Types.ObjectId;
    type: 'Ingredient' | 'Recipe';
    quantity: number;
    unit: Types.ObjectId;
    prepMethod: Types.ObjectId;
}

const recipeIngredientSchema = new Schema<RecipeIngredient>({
    ingredient: { type: Schema.Types.ObjectId, refPath: 'Ingredient', required: true },
    type: { type: String, enum: ['Ingredient', 'Recipe'], required: true },
    quantity: { type: Number, required: true },
    unit: { type: Schema.Types.ObjectId, ref: 'Unit', required: true },
    prepMethod: { type: Schema.Types.ObjectId, ref: 'PrepMethod' },
});
recipeIngredientSchema.pre('save', async function (next) {
    // Attribute validation
    const attribs = { ingredient: Ingredient, unit: Unit, prepMethod: PrepMethod };
    await validateMongooseObjectIds.call(this, attribs, next);
});

export interface Recipe extends Document {
    title: string;
    tags?: Types.ObjectId[];
    ingredients: RecipeIngredient[];
    instructions: string[];
    notes?: string[];
    owner: Types.ObjectId;
    source?: string;
    cuisine?: Types.ObjectId[];
}

const recipeSchema = new Schema<Recipe>({
    title: { type: String, required: true },
    tags: {
        type: [{ type: Schema.Types.ObjectId, ref: 'Tag' }],
        validate: tagValidator,
    },
    ingredients: {
        type: [{ type: recipeIngredientSchema }],
        required: true,
        validate: {
            validator: function (ingredients: RecipeIngredient[]) {
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
    notes: {
        type: [{ type: String }],
    },
    owner: { type: Schema.Types.ObjectId, required: true, ref: 'User' },
    source: { type: String },
    cuisine: {
        type: [{ type: Schema.Types.ObjectId, ref: 'Cuisine' }],
        validate: cuisineValidator,
    },
});

recipeSchema.pre('save', async function (next) {
    await validateMongooseObjectIds.call(this, { owner: User }, next);
    await validateMongooseObjectIdsArray.call(this, { tags: Tag, cuisine: Cuisine }, next);
});

export const Recipe = model<Recipe>('Recipe', recipeSchema);
export const RecipeTC = composeMongoose(Recipe);
