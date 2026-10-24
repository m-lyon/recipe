/**
 * Prepares existing recipes for recipe yields and recipe-line nutrition (issue #116).
 *
 *  - Clears `size` on lines that use a recipe. A yield has no size, so "1 large pizza dough"
 *    has no meaning, and the API now refuses a size on such a line.
 *  - Reports lines that use a recipe not marked as an ingredient. Saving such a recipe's
 *    lines is now refused, so they need fixing by hand: mark the used recipe as an
 *    ingredient, or change the line.
 *  - Reports cycles: recipes that use themselves through other recipes. Nutrition marks those
 *    lines CYCLE; a person decides which line to remove.
 *
 * Only the sizes are changed. Safe to re-run.
 *
 *   npm run compile
 *   MONGODB_URI=mongodb://localhost:27017/recipeProdBackup DRY_RUN=1 \
 *       node ./dist/src/scripts/updateSchema_2026-10-21.js
 *
 *  Fix the reported references and cycles by hand.
 *
 * The production MONGODB_URI is in /etc/recipe.env on the server. The order against the
 * deploy does not matter: the new API reads old data correctly.
 */
import { pathToFileURL } from 'url';

import mongoose, { mongo } from 'mongoose';

interface StoredLine {
    type?: 'ingredient' | 'recipe';
    ingredient: mongo.ObjectId;
    size?: mongo.ObjectId | null;
}

interface StoredRecipe {
    _id: mongo.ObjectId;
    title: string;
    isIngredient?: boolean;
    ingredientSubsections: Array<{ name?: string; ingredients: StoredLine[] }>;
}

export interface RecipeLineReport {
    dryRun: boolean;
    /** "Pizza: large Pizza Dough" for each size cleared, or to clear. */
    sizesCleared: string[];
    /** "Pizza uses Dinner" for each line that uses a recipe not marked as an ingredient. */
    notIngredient: string[];
    /** "A → B → A" for each cycle. */
    cycles: string[];
}

export async function migrateRecipeLines(
    db: mongo.Db,
    { dryRun = false }: { dryRun?: boolean } = {}
): Promise<RecipeLineReport> {
    const collection = db.collection<StoredRecipe>('recipes');
    const recipes = await collection
        .find({}, { projection: { title: 1, isIngredient: 1, ingredientSubsections: 1 } })
        .toArray();
    const byId = new Map(recipes.map((recipe) => [String(recipe._id), recipe]));
    const report: RecipeLineReport = { dryRun, sizesCleared: [], notIngredient: [], cycles: [] };
    const sizeNames = new Map(
        (
            await db
                .collection('sizes')
                .find({}, { projection: { value: 1 } })
                .toArray()
        ).map((size) => [String(size._id), String(size.value)])
    );

    for (const recipe of recipes) {
        let changed = false;
        for (const subsection of recipe.ingredientSubsections ?? []) {
            for (const line of subsection.ingredients ?? []) {
                const child = byId.get(String(line.ingredient));
                if (!child) continue;
                if (line.size != null) {
                    const size = sizeNames.get(String(line.size)) ?? 'unknown size';
                    report.sizesCleared.push(`${recipe.title}: ${size} ${child.title}`);
                    line.size = null;
                    changed = true;
                }
                if (!child.isIngredient) {
                    report.notIngredient.push(`${recipe.title} uses ${child.title}`);
                }
            }
        }
        if (changed && !dryRun) {
            await collection.updateOne(
                { _id: recipe._id },
                { $set: { ingredientSubsections: recipe.ingredientSubsections } }
            );
        }
    }

    // Depth-first, with the current path: a recipe met again on its own path is a cycle.
    const state = new Map<string, 'visiting' | 'done'>();
    const children = (recipe: StoredRecipe) =>
        (recipe.ingredientSubsections ?? [])
            .flatMap((subsection) => subsection.ingredients ?? [])
            .map((line) => String(line.ingredient))
            .filter((id) => byId.has(id));
    const visit = (id: string, path: string[]) => {
        state.set(id, 'visiting');
        for (const child of children(byId.get(id)!)) {
            if (state.get(child) === 'visiting') {
                const cycle = [...path.slice(path.indexOf(child)), child];
                report.cycles.push(cycle.map((step) => byId.get(step)!.title).join(' → '));
            } else if (!state.has(child)) {
                visit(child, [...path, child]);
            }
        }
        state.set(id, 'done');
    };
    for (const recipe of recipes) {
        const id = String(recipe._id);
        if (!state.has(id)) visit(id, [id]);
    }
    return report;
}

async function main() {
    const uri = process.env.MONGODB_URI;
    if (!uri) {
        console.error('Set MONGODB_URI to the database to migrate.');
        process.exit(1);
    }
    await mongoose.connect(uri);
    try {
        const report = await migrateRecipeLines(mongoose.connection.db, {
            dryRun: Boolean(process.env.DRY_RUN),
        });
        console.log(report.dryRun ? 'DRY RUN: nothing was written.' : 'Migration complete.');
        const list = (title: string, items: string[]) => {
            console.log(`\n${title}: ${items.length}`);
            for (const item of items) console.log(`  - ${item}`);
        };
        list(
            report.dryRun ? 'Sizes to clear on recipe lines' : 'Sizes cleared on recipe lines',
            report.sizesCleared
        );
        list(
            'Lines using a recipe not marked as an ingredient (fix by hand)',
            report.notIngredient
        );
        list('Cycles (fix by hand)', report.cycles);
    } finally {
        await mongoose.disconnect();
    }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
    main().catch((error) => {
        console.error(error);
        process.exit(1);
    });
}
