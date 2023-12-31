import { Schema, Document, model, Types } from 'mongoose';
import { composeMongoose } from 'graphql-compose-mongoose';
import { User } from './User.js';
import { Unit } from './Unit.js';
import { Ingredient } from './Ingredient.js';
import { PrepMethod } from './PrepMethod.js';
import { Tag, tagValidator } from './Tag.js';
import { validateMongooseObjectIds, validateMongooseObjectIdsArray } from './utils.js';
import { quantityRegex } from './utils.js';

export interface RecipeIngredient extends Document {
    ingredient: Types.ObjectId;
    type: 'ingredient' | 'recipe';
    quantity: string;
    unit?: Types.ObjectId;
    prepMethod?: Types.ObjectId;
}

const recipeIngredientSchema = new Schema<RecipeIngredient>({
    ingredient: { type: Schema.Types.ObjectId, refPath: 'Ingredient', required: true },
    type: { type: String, enum: { ingredient: 'ingredient', recipe: 'recipe' }, required: true },
    quantity: { type: String, required: true },
    unit: { type: Schema.Types.ObjectId, ref: 'Unit' },
    prepMethod: { type: Schema.Types.ObjectId, ref: 'PrepMethod' },
});
recipeIngredientSchema.pre('save', async function (next) {
    // Quantity validation
    if (!quantityRegex.test(this.quantity)) {
        const err = new Error('Invalid quantity format');
        return next(err);
    }
    // Attribute validation
    const attribs = { ingredient: Ingredient, unit: Unit, prepMethod: PrepMethod };
    await validateMongooseObjectIds.call(this, attribs, next);
});

export interface Recipe extends Document {
    title: string;
    pluralTitle?: string;
    subTitle?: string;
    tags?: Types.ObjectId[];
    ingredients: RecipeIngredient[];
    instructions: string[];
    notes?: string;
    owner: Types.ObjectId;
    source?: string;
    numServings: number;
    isIngredient: boolean;
}

const recipeSchema = new Schema<Recipe>({
    title: { type: String, required: true, unique: true },
    pluralTitle: { type: String },
    subTitle: { type: String },
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
    notes: { type: String },
    owner: { type: Schema.Types.ObjectId, required: true, ref: 'User' },
    source: { type: String },
    numServings: { type: Number, required: true },
    isIngredient: { type: Boolean, required: true },
});

recipeSchema.pre('save', async function (next) {
    await validateMongooseObjectIds.call(this, { owner: User }, next);
    await validateMongooseObjectIdsArray.call(this, { tags: Tag }, next);
});

export const RecipeIngredient = model<RecipeIngredient>('RecipeIngredient', recipeIngredientSchema);
export const RecipeIngredientTC = composeMongoose(RecipeIngredient);
export const Recipe = model<Recipe>('Recipe', recipeSchema);
export const RecipeTC = composeMongoose(Recipe);
