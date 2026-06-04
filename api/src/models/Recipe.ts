import { GraphQLError } from 'graphql';
import { composeMongoose } from 'graphql-compose-mongoose';
import { Document, HydratedDocument, Model, PopulatedDoc, Schema, Types, model } from 'mongoose';

import { Size } from './Size.js';
import { Unit } from './Unit.js';
import { PrepMethod } from './PrepMethod.js';
import { capitalise } from '../utils/string.js';
import { generateRandomString } from '../utils/random.js';
import type { Ingredient as IngredientType } from './Ingredient.js';
import { Ingredient, ReservedIngredientTags } from './Ingredient.js';
import { ownerExists, tagsExist, unique, uniqueRecipeTitleInAdminsAndUser } from './validation.js';

const quantityRegex = /^((\d+(\.\d+)?|[1-9]\d*\/[1-9]\d*)(-(\d+(\.\d+)?|[1-9]\d*\/[1-9]\d*))?)$/;
const ReservedRecipeTags = {
    Ingredient: 'ingredient',
    VeganVersionAvailable: 'vegan version available',
} as const;
export const ReservedTags = { ...ReservedRecipeTags, ...ReservedIngredientTags } as const;
type ReservedTags = (typeof ReservedTags)[keyof typeof ReservedTags];

export interface RecipeIngredientType extends Document {
    quantity?: string;
    unit?: Types.ObjectId;
    size?: Types.ObjectId;
    ingredient: PopulatedDoc<Document<Types.ObjectId> & IngredientType>;
    prepMethod?: Types.ObjectId;
    type: 'ingredient' | 'recipe';
}

export function generateRecipeIdentifier(title: string, existingSuffix?: string): string {
    // Remove special characters
    let sanitizedTitle = title.replace(/[^a-zA-Z0-9\s]/g, '');
    // Remove leading and trailing whitespaces
    sanitizedTitle = sanitizedTitle.trim();
    // Replace spaces with dashes and convert to lowercase
    sanitizedTitle = sanitizedTitle.replace(/\s+/g, '-').toLowerCase();
    const suffix = existingSuffix || generateRandomString(5);
    return `${sanitizedTitle}-${suffix}`;
}

const recipeIngredientSchema: Schema<RecipeIngredientType> = new Schema<RecipeIngredientType>({
    type: { type: String, enum: ['ingredient', 'recipe'] },
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
    size: {
        type: Schema.Types.ObjectId,
        ref: 'Size',
        validate: {
            validator: function (size: Types.ObjectId) {
                if (size != null) {
                    return Size.exists({ _id: size });
                }
                return true;
            },
            message: 'Size does not exist.',
        },
    },
    ingredient: {
        type: Schema.Types.ObjectId,
        ref: function (this: RecipeIngredientType) {
            return capitalise(this.type);
        },
        required: true,
        validate: {
            validator: async function (ingredient: Types.ObjectId): Promise<boolean> {
                const isIngredient = await Ingredient.exists({ _id: ingredient });
                const isRecipe: { _id: Types.ObjectId } | null = await Recipe.exists({
                    _id: ingredient,
                });
                return Boolean(isIngredient || isRecipe);
            },
            message: 'Ingredient does not exist.',
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
recipeIngredientSchema.pre('save', async function (this: HydratedDocument<RecipeIngredientType>) {
    const isIngredient = await Ingredient.exists({ _id: this.ingredient });
    if (isIngredient) {
        this.type = 'ingredient';
    } else {
        this.type = 'recipe';
    }
});

interface IngredientSubsection {
    name?: string;
    ingredients: RecipeIngredientType[];
}
const ingredientSubsection: Schema<IngredientSubsection> = new Schema<IngredientSubsection>({
    name: { type: String },
    ingredients: {
        type: [recipeIngredientSchema],
        required: true,
        validate: {
            validator: function (ingredients: RecipeIngredientType[]) {
                return ingredients.length > 0;
            },
            message: 'At least one ingredient is required.',
        },
    },
});
interface InstructionSubsection {
    name?: string;
    instructions: string[];
}
const instructionSubsection = new Schema({
    name: { type: String },
    instructions: {
        type: [String],
        required: true,
        validate: {
            validator: function (instructions: string[]) {
                return instructions.length > 0;
            },
            message: 'At least one instruction is required.',
        },
    },
});

export interface Recipe extends Document {
    title: string;
    titleIdentifier: string;
    pluralTitle?: string;
    subTitle?: string;
    calculatedTags: ReservedTags[];
    tags?: Types.ObjectId[];
    ingredientSubsections: IngredientSubsection[];
    instructionSubsections: InstructionSubsection[];
    notes?: string;
    owner: Types.ObjectId;
    source?: string;
    numServings: number;
    isIngredient: boolean;
    archived: boolean;
    createdAt: Date;
    lastModified: Date;
    veganVersion?: Types.ObjectId;
    originalRecipe?: Types.ObjectId;
}
const recipeSchema: Schema<Recipe> = new Schema<Recipe>({
    title: {
        type: String,
        required: true,
        validate: uniqueRecipeTitleInAdminsAndUser(),
        text: true,
    },
    titleIdentifier: {
        type: String,
        required: true,
        validate: unique('Recipe', 'titleIdentifier'),
    },
    pluralTitle: { type: String },
    subTitle: { type: String },
    calculatedTags: {
        type: [{ type: String, enum: ReservedTags }],
        required: true,
        text: true,
    },
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
        index: true,
    },
    ingredientSubsections: {
        type: [ingredientSubsection],
        required: true,
        validate: [
            {
                validator: function (ingredientSubsections: IngredientSubsection[]) {
                    return ingredientSubsections.length > 0;
                },
                message: 'At least one ingredient subsection is required.',
            },
            {
                validator: function (ingredientSubsections: IngredientSubsection[]) {
                    // If there is more than one subsection, all subsections must be named
                    if (ingredientSubsections.length > 1) {
                        return ingredientSubsections.every((subsection) => subsection.name != null);
                    }
                },
                message: 'All ingredient subsections must be named.',
            },
        ],
    },
    instructionSubsections: {
        type: [instructionSubsection],
        required: true,
        validate: [
            {
                validator: function (instructionSubsections: InstructionSubsection[]) {
                    return instructionSubsections.length > 0;
                },
                message: 'At least one instruction subsection is required.',
            },
            {
                validator: function (instructionSubsections: InstructionSubsection[]) {
                    // If there is more than one subsection, all subsections must be named
                    if (instructionSubsections.length > 1) {
                        return instructionSubsections.every(
                            (subsection) => subsection.name != null
                        );
                    }
                },
                message: 'All instruction subsections must be named.',
            },
        ],
    },
    notes: { type: String },
    owner: { type: Schema.Types.ObjectId, required: true, ref: 'User', validate: ownerExists() },
    source: { type: String },
    numServings: { type: Number, required: true },
    isIngredient: { type: Boolean, required: true },
    archived: { type: Boolean, default: false },
    createdAt: { type: Date, required: true },
    lastModified: { type: Date, required: true },
    veganVersion: { type: Schema.Types.ObjectId, ref: 'Recipe' },
    originalRecipe: { type: Schema.Types.ObjectId, ref: 'Recipe' },
});

recipeSchema.index({ 'ingredientSubsections.ingredients.ingredient': 1 });

recipeSchema.pre('save', async function (this: HydratedDocument<Recipe>) {
    const calculatedTags: ReservedTags[] = [];
    await this.populate('ingredientSubsections.ingredients.ingredient');
    if (this.isIngredient) {
        calculatedTags.push(ReservedRecipeTags.Ingredient);
    }
    for (const tag in ReservedIngredientTags) {
        const typedTag = tag as keyof typeof ReservedIngredientTags;
        const allMembers = this.ingredientSubsections.every((collection: IngredientSubsection) => {
            return collection.ingredients.every((recipeIngr: RecipeIngredientType) => {
                if (recipeIngr.type === 'ingredient') {
                    const ingr: IngredientType = recipeIngr.ingredient;
                    return ingr.tags.includes(ReservedIngredientTags[typedTag]);
                } else if (recipeIngr.type === 'recipe') {
                    const recipe: Recipe = recipeIngr.ingredient;
                    return recipe.calculatedTags.includes(ReservedIngredientTags[typedTag]);
                } else {
                    throw new Error('Invalid RecipeIngredient type');
                }
            });
        });
        if (allMembers) {
            calculatedTags.push(ReservedIngredientTags[typedTag]);
        }
    }
    if (this.veganVersion != null) {
        calculatedTags.push(ReservedRecipeTags.VeganVersionAvailable);
    }
    this.calculatedTags = calculatedTags;
    if (
        this.veganVersion != null &&
        calculatedTags.includes(ReservedIngredientTags.Vegan) &&
        this.isModified('ingredientSubsections')
    ) {
        throw new GraphQLError(
            'Cannot save original recipe as vegan when it has a linked vegan version',
            { extensions: { code: 'ORIGINAL_RECIPE_IS_VEGAN' } }
        );
    }
    if (this.originalRecipe != null && !calculatedTags.includes(ReservedIngredientTags.Vegan)) {
        throw new Error('Vegan recipe must have all vegan ingredients');
    }
});

export const RecipeIngredient = model<RecipeIngredientType>(
    'RecipeIngredient',
    recipeIngredientSchema
);
export const RecipeIngredientTC = composeMongoose(RecipeIngredient, { removeFields: ['type'] });
export const Recipe: Model<Recipe> = model<Recipe>('Recipe', recipeSchema);
export const RecipeTC = composeMongoose(Recipe);
export const RecipeModifyTC = composeMongoose(Recipe, {
    removeFields: [
        'titleIdentifier',
        'calculatedTags',
        'archived',
        'createdAt',
        'lastModified',
        'veganVersion',
        'originalRecipe',
    ],
    name: 'RecipeModify',
});
export const RecipeCreateTC = composeMongoose(Recipe, {
    removeFields: [
        'owner',
        'titleIdentifier',
        'calculatedTags',
        'archived',
        'createdAt',
        'lastModified',
        'veganVersion',
        'originalRecipe',
    ],
    name: 'RecipeCreate',
});
