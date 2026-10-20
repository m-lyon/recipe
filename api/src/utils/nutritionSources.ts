import { mongo } from 'mongoose';

export interface NutritionSourceReport {
    usda: number;
    manual: number;
}

/**
 * Sets `source` on nutritional info saved before the field existed: `usda` where it has
 * a USDA ID, `manual` elsewhere. Safe to run on every start: it touches only records with
 * no source.
 */
export async function syncNutritionSources(db: mongo.Db): Promise<NutritionSourceReport> {
    const infos = db.collection('nutritionalinfos');
    const usda = await infos.updateMany(
        { source: { $exists: false }, usdaFdcId: { $ne: null } },
        { $set: { source: 'usda' } }
    );
    const manual = await infos.updateMany(
        { source: { $exists: false } },
        { $set: { source: 'manual' } }
    );
    return { usda: usda.modifiedCount, manual: manual.modifiedCount };
}
