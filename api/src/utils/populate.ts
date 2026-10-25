import fs from 'fs';
import path from 'path';

import mongoose, { Types } from 'mongoose';

import { Tag } from '../models/Tag.js';
import { Unit } from '../models/Unit.js';
import { User } from '../models/User.js';
import { Size } from '../models/Size.js';
import { Image } from '../models/Image.js';
import { IMAGE_DIR } from '../constants.js';
import { Rating } from '../models/Rating.js';
import { Ingredient } from '../models/Ingredient.js';
import { PrepMethod } from '../models/PrepMethod.js';
import { DisplayLadder } from '../models/DisplayLadder.js';
import { NutritionalInfo } from '../models/NutritionalInfo.js';
import { IngredientMeasure } from '../models/IngredientMeasure.js';
import { Recipe, generateRecipeIdentifier } from '../models/Recipe.js';
import { describeStandardUnitReport, syncStandardUnits } from './standardUnits.js';
import { SEED_COUNT_UNITS, SEED_INGREDIENTS, SEED_PREP_METHODS } from './seedData.js';
import { SEED_RECIPES, SEED_SIZES, SEED_TAGS, SEED_USERS, SeedOwner } from './seedData.js';

const DAY_MS = 24 * 60 * 60 * 1000;

async function owners(): Promise<Record<SeedOwner, Types.ObjectId>> {
    const admin = await User.findOne({ role: 'admin' }).orFail();
    const user = await User.findOne({ username: 'matt@gmail.com' }).orFail();
    return { admin: admin._id, user: user._id };
}

/** Ids by name, so the data tables can refer to documents by what people call them. */
async function lookup<T extends { _id: Types.ObjectId }>(
    docs: Promise<T[]>,
    key: (doc: T) => string
): Promise<(name: string) => Types.ObjectId> {
    const byName = new Map((await docs).map((doc) => [key(doc), doc._id]));
    return (name: string) => {
        const id = byName.get(name);
        if (!id) throw new Error(`Seed data refers to a missing item: ${name}`);
        return id;
    };
}

function slug(title: string) {
    return title
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '');
}

export async function populateUsers() {
    await User.deleteMany({});
    for (const user of SEED_USERS) {
        await User.register(new User(user), 'password1');
    }
    console.log(`Users: ${SEED_USERS.map((u) => `${u.username} (${u.role})`).join(', ')}`);
}

export async function populateTags() {
    await Tag.deleteMany({});
    await Tag.create(SEED_TAGS.map((value) => ({ value })));
    console.log(`Tags: ${SEED_TAGS.length}`);
}

/** Standard units come from code; the seed adds the count units people make up. */
export async function populateUnits() {
    await Unit.deleteMany({});
    await Unit.syncIndexes();
    const report = await syncStandardUnits(mongoose.connection.db);
    const owner = await owners();
    await Unit.create(
        SEED_COUNT_UNITS.map((unit) => ({
            ...unit,
            owner: owner[unit.owner],
            unique: unit.unique ?? true,
            preferredNumberFormat: 'fraction',
            hasSpace: true,
            dimension: 'count',
            perCanonical: 1,
            system: null,
        }))
    );
    console.log(`Units: ${report.created.length} standard, ${SEED_COUNT_UNITS.length} count units`);
    for (const line of describeStandardUnitReport(report).filter((l) => !l.startsWith('created'))) {
        console.log(`  ${line}`);
    }
}

export async function populateSizes() {
    await Size.deleteMany({});
    const { admin } = await owners();
    await Size.create(SEED_SIZES.map((value) => ({ value, unique: true, owner: admin })));
    console.log(`Sizes: ${SEED_SIZES.length}`);
}

export async function populatePrepMethods() {
    await PrepMethod.deleteMany({});
    const { admin } = await owners();
    await PrepMethod.create(
        SEED_PREP_METHODS.map((value) => ({ value, unique: true, owner: admin }))
    );
    console.log(`Prep methods: ${SEED_PREP_METHODS.length}`);
}

export async function populateIngredients() {
    await Ingredient.deleteMany({});
    const owner = await owners();
    await Ingredient.create(
        SEED_INGREDIENTS.map((ingredient) => ({
            name: ingredient.name,
            pluralName: ingredient.plural ?? ingredient.name,
            isCountable: ingredient.countable ?? false,
            tags: ingredient.tags ?? [],
            owner: owner[ingredient.owner ?? 'admin'],
        }))
    );
    console.log(`Ingredients: ${SEED_INGREDIENTS.length}`);
}

export async function populateNutritionalInfo() {
    await NutritionalInfo.deleteMany({});
    const ingredient = await lookup(Ingredient.find(), (i) => i.name);
    const withNutrition = SEED_INGREDIENTS.filter((i) => i.per100g);
    await NutritionalInfo.create(
        withNutrition.map(({ name, per100g }) => {
            const [calories, protein, carbs, fat] = per100g!.map((value) => value / 100);
            return {
                ingredient: ingredient(name),
                source: 'manual',
                perGram: { calories, protein, carbs, fat },
            };
        })
    );
    const without = SEED_INGREDIENTS.filter((i) => !i.per100g).map((i) => i.name);
    console.log(`Nutritional info: ${withNutrition.length} (none for ${without.join(', ')})`);
}

export async function populateIngredientMeasures() {
    await IngredientMeasure.deleteMany({});
    const ingredient = await lookup(Ingredient.find(), (i) => i.name);
    const unit = await lookup(Unit.find(), (u) => u.longSingular);
    const size = await lookup(Size.find(), (s) => s.value);
    const prep = await lookup(PrepMethod.find(), (p) => p.value);
    const measures = SEED_INGREDIENTS.flatMap(({ name, measures = [] }) =>
        measures.map(([unitName, grams, narrow]) => ({
            ingredient: ingredient(name),
            unit: unit(unitName),
            size: narrow?.size ? size(narrow.size) : null,
            prepMethod: narrow?.prep ? prep(narrow.prep) : null,
            grams,
        }))
    );
    await IngredientMeasure.create(measures);
    console.log(`Ingredient measures: ${measures.length}`);
}

export async function populateDisplayLadders() {
    await DisplayLadder.deleteMany({});
    const { admin } = await owners();
    const units = await Unit.find({ standard: { $ne: null } });
    const unit = (key: string) => units.find((u) => u.standard === key)!;
    const step = (key: string, minCanonical: number) => ({ unit: unit(key)._id, minCanonical });
    const ladder = (name: string, steps: Array<ReturnType<typeof step>>) => {
        const [system, dimension] = name.split('-');
        return { name, system, dimension, scope: 'global', owner: admin, steps };
    };
    const ladders = [
        ladder('metric-mass', [step('kilogram', 1000), step('gram', 0)]),
        ladder('metric-volume', [step('litre', 1000), step('millilitre', 0)]),
        ladder('us-mass', [step('pound', unit('pound').perCanonical), step('ounce', 0)]),
        ladder('us-volume', [
            step('cup', unit('cup').perCanonical / 4),
            step('tablespoon', unit('tablespoon').perCanonical),
            step('teaspoon', 0),
        ]),
    ];
    await DisplayLadder.create(ladders);
    console.log(`Display ladders: ${ladders.map((l) => l.name).join(', ')}`);
}

export async function populateRecipes() {
    await Recipe.deleteMany({});
    const owner = await owners();
    const tag = await lookup(Tag.find(), (t) => t.value);
    const ingredient = await lookup(Ingredient.find(), (i) => i.name);
    const unit = await lookup(Unit.find(), (u) => u.longSingular);
    const size = await lookup(Size.find(), (s) => s.value);
    const prep = await lookup(PrepMethod.find(), (p) => p.value);
    const recipes = new Map<string, Types.ObjectId>();
    const now = Date.now();

    // In table order, so a recipe used as an ingredient exists before the recipes using it.
    for (const seed of SEED_RECIPES) {
        const date = new Date(now - seed.daysAgo * DAY_MS);
        const recipe = await Recipe.create({
            title: seed.title,
            titleIdentifier: generateRecipeIdentifier(seed.title),
            pluralTitle: seed.pluralTitle,
            subTitle: seed.subTitle,
            tags: seed.tags.map(tag),
            ingredientSubsections: seed.ingredients.map((subsection) => ({
                name: subsection.name,
                ingredients: subsection.lines.map(([quantity, unitName, name, narrow]) => ({
                    quantity,
                    unit: unitName ? unit(unitName) : null,
                    ingredient: recipes.get(name) ?? ingredient(name),
                    size: narrow?.size ? size(narrow.size) : null,
                    prepMethod: narrow?.prep ? prep(narrow.prep) : null,
                })),
            })),
            instructionSubsections: seed.instructions.map((subsection) => ({
                name: subsection.name,
                instructions: subsection.steps,
            })),
            notes: seed.notes,
            source: seed.source,
            owner: owner[seed.owner ?? 'admin'],
            numServings: seed.servings,
            isIngredient: seed.isIngredient ?? false,
            yield: seed.yield?.map(([quantity, unitName]) => ({
                quantity,
                unit: unit(unitName ?? 'each'),
            })),
            archived: seed.archived ?? false,
            createdAt: date,
            lastModified: date,
        });
        recipes.set(seed.title, recipe._id);
    }

    for (const seed of SEED_RECIPES.filter((r) => r.veganVersionOf)) {
        const vegan = await Recipe.findById(recipes.get(seed.title)).orFail();
        const original = await Recipe.findById(recipes.get(seed.veganVersionOf!)).orFail();
        vegan.originalRecipe = original._id;
        await vegan.save();
        original.veganVersion = vegan._id;
        await original.save();
    }
    console.log(`Recipes: ${SEED_RECIPES.length}`);
}

export async function populateRatings() {
    await Rating.deleteMany({});
    const owner = await owners();
    const recipe = await lookup(Recipe.find(), (r) => r.title);
    const ratings = SEED_RECIPES.flatMap((seed) =>
        (seed.ratings ?? []).map(([who, value]) => ({
            recipe: recipe(seed.title),
            owner: owner[who],
            value,
        }))
    );
    await Rating.create(ratings);
    console.log(`Ratings: ${ratings.length}`);
}

/** Photos come from picsum.photos, seeded by recipe, so each run gets the same pictures. */
export async function populateImages() {
    await Image.deleteMany({});
    fs.rmSync(IMAGE_DIR, { recursive: true, force: true });
    fs.mkdirSync(IMAGE_DIR, { recursive: true });
    const recipe = await lookup(Recipe.find(), (r) => r.title);
    let saved = 0;
    for (const seed of SEED_RECIPES.filter((r) => r.images)) {
        for (let i = 1; i <= seed.images!; i++) {
            const fileName = `${slug(seed.title)}_${i}.jpeg`;
            try {
                const res = await fetch(
                    `https://picsum.photos/seed/${slug(seed.title)}-${i}/600/400`
                );
                if (!res.ok) throw new Error(`HTTP ${res.status}`);
                fs.writeFileSync(
                    path.join(IMAGE_DIR, fileName),
                    Buffer.from(await res.arrayBuffer())
                );
            } catch (error) {
                console.warn(`  Could not download a photo for ${seed.title}: ${error}`);
                continue;
            }
            await Image.create({
                origUrl: `uploads/images/${fileName}`,
                recipe: recipe(seed.title),
                note: i === 1 ? 'The finished dish' : undefined,
            });
            saved++;
        }
    }
    console.log(`Images: ${saved}`);
}
