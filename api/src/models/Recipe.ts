import { Schema, Document, model, Types } from 'mongoose';
import { composeMongoose } from 'graphql-compose-mongoose';
import { User } from './User.js';
import { Unit } from './Unit.js';
import { Ingredient } from './Ingredient.js';
import { PrepMethod } from './PrepMethod.js';
import { Tag, tagValidator } from './Tag.js';
import { validateMongooseObjectIds, validateMongooseObjectIdsArray } from './utils.js';
import { quantityRegex } from './utils.js';

export interface RecipeIngredientType extends Document {
    ingredient: Types.ObjectId;
    type: 'ingredient' | 'recipe';
    quantity?: string;
    unit?: Types.ObjectId;
    prepMethod?: Types.ObjectId;
}

export async function validateIngredientIds(next: any) {
    try {
        if (this.type === 'ingredient') {
            const doc = await Ingredient.findById(this.ingredient);
            if (!doc) {
                throw new Error(`Ingredient not found: ${this.ingredient}.`);
            }
        } else {
            const doc = await Recipe.findById(this.ingredient);
            if (!doc) {
                throw new Error(`Recipe not found: ${this.ingredient}.`);
            }
        }
        next();
    } catch (err) {
        next(err);
    }
}

function generateRecipeIdentifier(title: string): string {
    // Remove special characters
    let sanitizedTitle = title.replace(/[^a-zA-Z0-9\s]/g, '');
    // Remove leading and trailing whitespaces
    sanitizedTitle = sanitizedTitle.trim();
    // Replace spaces with dashes and convert to lowercase
    sanitizedTitle = sanitizedTitle.replace(/\s+/g, '-').toLowerCase();

    return sanitizedTitle;
}

const recipeIngredientSchema = new Schema<RecipeIngredientType>({
    ingredient: {
        type: Schema.Types.ObjectId,
        refPath: function () {
            return this.type === 'ingredient' ? 'Ingredient' : 'Recipe';
        },
        required: true,
    },
    type: { type: String, enum: ['ingredient', 'recipe'], required: true },
    quantity: { type: String },
    unit: { type: Schema.Types.ObjectId, ref: 'Unit' },
    prepMethod: { type: Schema.Types.ObjectId, ref: 'PrepMethod' },
});
recipeIngredientSchema.pre('save', async function (next) {
    // Quantity validation
    if (this.quantity != null && !quantityRegex.test(this.quantity)) {
        const err = new Error('Invalid quantity format');
        return next(err);
    }
    // Attribute validation
    const attribs = { unit: Unit, prepMethod: PrepMethod };
    await validateIngredientIds.call(this, next);
    await validateMongooseObjectIds.call(this, attribs, next);
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
    title: { type: String, required: true, unique: true },
    titleIdentifier: { type: String, unique: true },
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
    owner: { type: Schema.Types.ObjectId, required: true, ref: 'User' },
    source: { type: String },
    numServings: { type: Number, required: true },
    isIngredient: { type: Boolean, required: true },
});

recipeSchema.pre('save', async function (next) {
    this.titleIdentifier = generateRecipeIdentifier(this.title);
    await validateMongooseObjectIds.call(this, { owner: User }, next);
    await validateMongooseObjectIdsArray.call(this, { tags: Tag }, next);
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
export const RecipeQueryTC = composeMongoose(Recipe);
