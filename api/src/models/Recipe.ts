import { Schema, Document, model, Types } from 'mongoose';
import { tagValidator } from './Tag';
import { cuisineValidator } from './Cuisine';

export interface RecipeIngredient extends Document {
    ingredient: Types.ObjectId;
    ingredientType: 'Ingredient' | 'Recipe';
    amount: number;
    unit: Types.ObjectId;
    prepMethod: Types.ObjectId;
}

const recipeIngredientSchema = new Schema<RecipeIngredient>({
    ingredient: { type: Schema.Types.ObjectId, refPath: 'ingredientType', required: true },
    ingredientType: { type: String, enum: ['Ingredient', 'Recipe'], required: true },
    amount: { type: Number, required: true },
    unit: { type: Schema.Types.ObjectId, ref: 'Unit', required: true },
    prepMethod: { type: Schema.Types.ObjectId, ref: 'PrepMethod' },
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

export const Recipe = model<Recipe>('Recipe', recipeSchema);
