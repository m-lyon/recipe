/**
 * Sets the now required `source` on nutritional info saved before it existed (issue #124):
 * `usda` where the record has a USDA ID, `manual` elsewhere. Safe to re-run: it touches
 * only records with no source.
 *
 *   npm run compile
 *   MONGODB_URI=mongodb://localhost:27017/recipeProdBackup DRY_RUN=1 \
 *       node ./dist/src/scripts/updateSchema_2026-10-20.js
 *
 * Run it before the API that requires `source` is deployed. The API before it ignores the
 * field, but the one after it cannot read a record without it.
 */
import { pathToFileURL } from 'url';

import mongoose, { mongo } from 'mongoose';

export interface SourceMigrationReport {
    dryRun: boolean;
    usda: number;
    manual: number;
}

const NO_SOURCE = { source: { $exists: false } };
const HAS_USDA_ID = { usdaFdcId: { $ne: null } };

export async function migrateNutritionSources(
    db: mongo.Db,
    { dryRun = false }: { dryRun?: boolean } = {}
): Promise<SourceMigrationReport> {
    const infos = db.collection('nutritionalinfos');
    if (dryRun) {
        const usda = await infos.countDocuments({ ...NO_SOURCE, ...HAS_USDA_ID });
        const all = await infos.countDocuments(NO_SOURCE);
        return { dryRun, usda, manual: all - usda };
    }
    // USDA first: the second update then takes every record still without a source.
    const usda = await infos.updateMany(
        { ...NO_SOURCE, ...HAS_USDA_ID },
        { $set: { source: 'usda' } }
    );
    const manual = await infos.updateMany(NO_SOURCE, { $set: { source: 'manual' } });
    return { dryRun, usda: usda.modifiedCount, manual: manual.modifiedCount };
}

async function main() {
    const uri = process.env.MONGODB_URI;
    if (!uri) {
        console.error('Set MONGODB_URI to the database to migrate.');
        process.exit(1);
    }
    await mongoose.connect(uri);
    try {
        const report = await migrateNutritionSources(mongoose.connection.db, {
            dryRun: Boolean(process.env.DRY_RUN),
        });
        console.log(report.dryRun ? 'DRY RUN: nothing was written.' : 'Migration complete.');
        console.log(`Set to usda: ${report.usda}`);
        console.log(`Set to manual: ${report.manual}`);
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
