import { EMAIL_FROM } from '../constants.js';
import { sendEmail } from './email.js';
import { User } from '../models/User.js';
import { NutritionalInfo } from '../models/NutritionalInfo.js';

interface MissingConversion {
    ingredientName: string;
    unitName?: string;
    reason: string;
    ingredientOwnerId: string;
    unitOwnerId?: string;
}

type PopulatedIngredient = {
    _id: unknown;
    name: string;
    density?: number;
    owner: unknown;
};

type PopulatedUnit = {
    _id: unknown;
    shortSingular: string;
    measureType?: 'mass' | 'volume';
    owner: unknown;
};

type PopulatedRecipeIngredient = {
    type: string;
    quantity?: string;
    ingredient: PopulatedIngredient | unknown;
    unit?: PopulatedUnit;
};

type PopulatedSubsection = {
    ingredients: PopulatedRecipeIngredient[];
};

export type PopulatedRecipe = {
    title: string;
    ingredientSubsections: PopulatedSubsection[];
};

function isPopulatedIngredient(value: unknown): value is PopulatedIngredient {
    return typeof value === 'object' && value !== null && 'name' in value && 'owner' in value;
}

export async function sendNutritionalNotifications(recipe: PopulatedRecipe): Promise<void> {
    if (!EMAIL_FROM) {
        console.error('EMAIL_FROM not configured; skipping nutritional notifications.');
        return;
    }

    // Collect all ingredient IDs for a single batch DB fetch (avoid N+1)
    const ingredientIds: unknown[] = [];
    for (const subsection of recipe.ingredientSubsections) {
        for (const recipeIngr of subsection.ingredients) {
            if (recipeIngr.type !== 'ingredient') continue;
            if (!recipeIngr.quantity) continue;
            if (!isPopulatedIngredient(recipeIngr.ingredient)) continue;
            ingredientIds.push(recipeIngr.ingredient._id);
        }
    }

    if (ingredientIds.length === 0) return;

    const nutritionalInfoDocs = await NutritionalInfo.find({
        ingredient: { $in: ingredientIds },
    });
    const nutritionalInfoMap = new Map(
        nutritionalInfoDocs.map((doc) => [String(doc.ingredient), doc])
    );

    const missing: MissingConversion[] = [];

    for (const subsection of recipe.ingredientSubsections) {
        for (const recipeIngr of subsection.ingredients) {
            if (recipeIngr.type !== 'ingredient') continue;
            if (!recipeIngr.quantity) continue;

            // Guard against dangling/unpopulated refs
            if (!isPopulatedIngredient(recipeIngr.ingredient)) continue;
            const ingredient = recipeIngr.ingredient;

            const nutritionalInfo = nutritionalInfoMap.get(String(ingredient._id)) ?? null;

            if (!nutritionalInfo) {
                missing.push({
                    ingredientName: ingredient.name,
                    unitName: recipeIngr.unit?.shortSingular,
                    reason: 'No nutritional information found for this ingredient.',
                    ingredientOwnerId: String(ingredient.owner),
                });
                continue;
            }

            const unit = recipeIngr.unit;

            if (!unit) {
                // Countable: needs perUnit
                if (!nutritionalInfo.perUnit) {
                    missing.push({
                        ingredientName: ingredient.name,
                        reason: 'Ingredient is used without a unit but has no per-unit nutritional data.',
                        ingredientOwnerId: String(ingredient.owner),
                    });
                }
                continue;
            }

            // Has unit: measureType must be set (unit owner's responsibility)
            if (!unit.measureType) {
                missing.push({
                    ingredientName: ingredient.name,
                    unitName: unit.shortSingular,
                    reason: `Unit "${unit.shortSingular}" has no measure type (mass/volume) set.`,
                    ingredientOwnerId: String(ingredient.owner),
                    unitOwnerId: String(unit.owner),
                });
                continue;
            }

            // Missing perGram is always ingredient owner's responsibility
            if (!nutritionalInfo.perGram) {
                missing.push({
                    ingredientName: ingredient.name,
                    unitName: unit.shortSingular,
                    reason: 'Ingredient has no per-gram nutritional data.',
                    ingredientOwnerId: String(ingredient.owner),
                });
                continue;
            }

            // For volume units, ingredient must have density set (ingredient owner's responsibility)
            if (unit.measureType === 'volume' && !ingredient.density) {
                missing.push({
                    ingredientName: ingredient.name,
                    unitName: unit.shortSingular,
                    reason: `Ingredient "${ingredient.name}" is measured by volume but has no density set.`,
                    ingredientOwnerId: String(ingredient.owner),
                });
            }
        }
    }

    if (missing.length === 0) return;

    // Group by owner — each owner gets one batched email
    const emailMap = new Map<string, MissingConversion[]>();
    for (const m of missing) {
        const ownerId = m.ingredientOwnerId;
        if (!emailMap.has(ownerId)) emailMap.set(ownerId, []);
        emailMap.get(ownerId)!.push(m);

        // Unit owner notified separately only if different from ingredient owner
        if (m.unitOwnerId && m.unitOwnerId !== m.ingredientOwnerId) {
            if (!emailMap.has(m.unitOwnerId)) emailMap.set(m.unitOwnerId, []);
            emailMap.get(m.unitOwnerId)!.push(m);
        }
    }

    // Fan out owner lookups and email sends concurrently
    await Promise.all(
        [...emailMap.entries()].map(async ([ownerId, items]) => {
            const owner = await User.findById(ownerId);
            const ownerEmail = (owner as unknown as { username?: string })?.username;
            if (!ownerEmail) return;

            const lines = items.map(
                (m) => `- ${m.ingredientName}${m.unitName ? ` (${m.unitName})` : ''}: ${m.reason}`
            );
            const body = [
                `The recipe "${recipe.title}" was saved but the following ingredients are missing nutritional data:`,
                '',
                ...lines,
                '',
                'Please update the affected ingredient(s) and unit(s) so that calorie information can be calculated correctly.',
            ].join('\n');

            await sendEmail(EMAIL_FROM, ownerEmail, 'Missing nutritional info in recipe', body);
        })
    );
}
