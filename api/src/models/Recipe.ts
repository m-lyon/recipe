import { Schema, Document, model, Types } from 'mongoose';
import { tagValidator } from './Tag';

export interface IRecipeIngredient extends Document {
    ingredient: Types.ObjectId;
    ingredientType: 'Ingredient' | 'Recipe';
    amount: number;
    unit: Types.ObjectId;
    prepMethod: Types.ObjectId;
}

const recipeIngredientSchema = new Schema<IRecipeIngredient>({
    ingredient: { type: Schema.Types.ObjectId, refPath: 'ingredientType', required: true },
    ingredientType: { type: String, enum: ['Ingredient', 'Recipe'], required: true },
    amount: { type: Number, required: true },
    unit: { type: Schema.Types.ObjectId, ref: 'Unit', required: true },
    prepMethod: { type: Schema.Types.ObjectId, ref: 'PrepMethod' },
});

export interface IRecipe extends Document {
    title: string;
    tags?: Types.ObjectId[];
    ingredients: IRecipeIngredient[];
    instructions: string[];
    notes?: string[];
    owner: Types.ObjectId;
    source?: string;
}

const recipeSchema = new Schema<IRecipe>({
    title: { type: String, required: true },
    tags: {
        type: [{ type: Schema.Types.ObjectId, ref: 'Tag' }],
        validate: tagValidator,
    },
    ingredients: {
        type: [{ type: recipeIngredientSchema }],
        required: true,
        validate: {
            validator: function (ingredients: IRecipeIngredient[]) {
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
});

export const Recipe = model<IRecipe>('Recipe', recipeSchema);
