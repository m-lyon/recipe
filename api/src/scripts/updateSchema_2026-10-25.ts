/**
 * Prepares nutritional info for one record per prep method: lime, and lime juiced.
 *
 *  - Sets `prepMethod: null` on records saved before the field existed.
 *  - Drops the unique index on `ingredient` alone, which refuses a second record for an
 *    ingredient, and builds the unique index on `ingredient` and `prepMethod`.
 *
 * Safe to re-run. The order against the deploy does not matter: the new API reads a record
 * with no prepMethod as one with none. But until this runs, the database refuses a record for
 * a prep method.
 *
 *        npm run compile
 *        MONGODB_URI="<production MONGODB_URI>" DRY_RUN=1 \
 *            node ./dist/src/scripts/updateSchema_2026-10-25.js
 *
 */
import { pathToFileURL } from 'url';

import mongoose, { mongo } from 'mongoose';

export interface PrepMethodMigrationReport {
    dryRun: boolean;
    /** Records given `prepMethod: null`, or to be given it. */
    prepMethodSet: number;
    /** True when the index on `ingredient` alone was dropped, or would be. */
    indexDropped: boolean;
}

const OLD_INDEX = 'ingredient_1';
const NEW_INDEX = { ingredient: 1, prepMethod: 1 } as const;

export async function migrateNutritionPrepMethods(
    db: mongo.Db,
    { dryRun = false }: { dryRun?: boolean } = {}
): Promise<PrepMethodMigrationReport> {
    const infos = db.collection('nutritionalinfos');
    const noField = { prepMethod: { $exists: false } };
    const indexes = (await db.listCollections({ name: 'nutritionalinfos' }).hasNext())
        ? await infos.indexes()
        : [];
    const indexDropped = indexes.some((index) => index.name === OLD_INDEX);
    if (dryRun) {
        return { dryRun, prepMethodSet: await infos.countDocuments(noField), indexDropped };
    }
    const set = await infos.updateMany(noField, { $set: { prepMethod: null } });
    if (indexDropped) {
        await infos.dropIndex(OLD_INDEX);
    }
    await infos.createIndex(NEW_INDEX, { unique: true });
    return { dryRun, prepMethodSet: set.modifiedCount, indexDropped };
}

async function main() {
    const uri = process.env.MONGODB_URI;
    if (!uri) {
        console.error('Set MONGODB_URI to the database to migrate.');
        process.exit(1);
    }
    await mongoose.connect(uri);
    try {
        const report = await migrateNutritionPrepMethods(mongoose.connection.db, {
            dryRun: Boolean(process.env.DRY_RUN),
        });
        console.log(report.dryRun ? 'DRY RUN: nothing was written.' : 'Migration complete.');
        console.log(
            `${report.dryRun ? 'To set' : 'Set'} prepMethod to null: ${report.prepMethodSet}`
        );
        const dropped = report.dryRun ? 'to drop' : 'dropped';
        console.log(
            `Unique index on ingredient alone: ${report.indexDropped ? dropped : 'not present'}`
        );
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
