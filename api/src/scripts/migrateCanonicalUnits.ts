/**
 * Migrates unit conversion groups, densities and per-unit macros to canonical units
 * (issue #115). Runs the phases of the issue in order and prints a report of everything it
 * could not carry over. Safe to re-run: every step skips data that is already migrated.
 *
 *   npm run compile
 *   MONGODB_URI=mongodb://localhost:27017/recipeProdBackup DRY_RUN=1 \
 *       node ./dist/src/scripts/migrateCanonicalUnits.js
 *
 * Run it against a backup first. Without DRY_RUN it writes, and the final phase drops the
 * unitconversions and conversionrules collections.
 */
import { pathToFileURL } from 'url';

import mongoose, { Types, mongo } from 'mongoose';

import { knownMagnitude } from '../utils/units.js';
import type { UnitDimension, UnitSystem } from '../models/Unit.js';

type Db = mongo.Db;
type ObjectId = Types.ObjectId;

interface LegacyUnit {
    _id: ObjectId;
    shortSingular: string;
    shortPlural: string;
    longSingular: string;
    longPlural: string;
    owner: ObjectId;
    measureType?: 'mass' | 'volume' | null;
    dimension?: UnitDimension;
    perCanonical?: number;
    system?: UnitSystem | null;
    hidden?: boolean;
}
interface LegacyRule {
    _id: ObjectId;
    unit: ObjectId;
    baseUnit: ObjectId;
    baseUnitThreshold: number;
    baseToUnitConversion: number;
}
interface LegacyConversion {
    _id: ObjectId;
    baseUnit: ObjectId;
    rules: ObjectId[];
}
interface Macros {
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
}

interface Magnitude {
    dimension: UnitDimension;
    perCanonical: number;
    system: UnitSystem | null;
    source: string;
}

export interface MigrationReport {
    dryRun: boolean;
    unitsAssigned: Array<{ unit: string } & Magnitude>;
    unitsAlreadyAssigned: string[];
    unitsUnassigned: Array<{ unit: string; reason: string }>;
    /** Units with no known size, made count units. An owner should check each one. */
    unitsAssumedCount: string[];
    eachUnit: 'created' | 'updated' | 'missing admin';
    recipeLinesRewritten: number;
    densityMeasuresCreated: number;
    densityNotMigrated: Array<{ ingredient: string; reason: string }>;
    countMeasuresCreated: number;
    perUnitNotMigrated: Array<{ ingredient: string; reason: string }>;
    laddersCreated: string[];
    ladderStepsDropped: Array<{ ladder: string; unit: string; reason: string }>;
    nutritionalInfosRemoved: Array<{ ingredient: string; reason: string }>;
    collectionsDropped: string[];
}

export interface MigrationOptions {
    dryRun?: boolean;
}

function unitName(unit: Pick<LegacyUnit, 'longSingular'> | undefined): string {
    return unit?.longSingular ?? '(unknown unit)';
}

/** Phase 1: give every unit a dimension, a size and a system. */
async function assignUnitMagnitudes(db: Db, report: MigrationReport, write: boolean) {
    const units = await db.collection<LegacyUnit>('units').find().toArray();
    const rules = await db.collection<LegacyRule>('conversionrules').find().toArray();
    const conversions = await db.collection<LegacyConversion>('unitconversions').find().toArray();

    const byId = new Map(units.map((unit) => [String(unit._id), unit]));
    const assigned = new Map<string, Magnitude>();
    for (const unit of units) {
        if (unit.dimension && unit.perCanonical) {
            report.unitsAlreadyAssigned.push(unit.longSingular);
            assigned.set(String(unit._id), {
                dimension: unit.dimension,
                perCanonical: unit.perCanonical,
                system: unit.system ?? null,
                source: 'existing',
            });
            continue;
        }
        const known = knownMagnitude([
            unit.longSingular,
            unit.shortSingular,
            unit.longPlural,
            unit.shortPlural,
        ]);
        if (known && (unit.measureType == null || unit.measureType === known.dimension)) {
            assigned.set(String(unit._id), { ...known, source: 'known unit' });
        }
    }

    // A rule says 1 unit = baseToUnitConversion base units, so one known unit in a group
    // fixes the size of every other unit in it.
    const groups = conversions.map((conversion) => ({
        base: String(conversion.baseUnit),
        rules: rules.filter((rule) => String(rule.baseUnit) === String(conversion.baseUnit)),
    }));
    let changed = true;
    while (changed) {
        changed = false;
        for (const group of groups) {
            const base = assigned.get(group.base);
            if (!base) {
                const anchor = group.rules.find((rule) => assigned.has(String(rule.unit)));
                if (anchor) {
                    const known = assigned.get(String(anchor.unit))!;
                    assigned.set(group.base, {
                        dimension: known.dimension,
                        perCanonical: known.perCanonical / anchor.baseToUnitConversion,
                        system: known.system,
                        source: `conversion group of ${unitName(byId.get(String(anchor.unit)))}`,
                    });
                    changed = true;
                }
                continue;
            }
            for (const rule of group.rules) {
                if (!assigned.has(String(rule.unit))) {
                    assigned.set(String(rule.unit), {
                        dimension: base.dimension,
                        perCanonical: base.perCanonical * rule.baseToUnitConversion,
                        system: base.system,
                        source: `conversion group of ${unitName(byId.get(group.base))}`,
                    });
                    changed = true;
                }
            }
        }
    }

    const inGroup = new Set(groups.flatMap((g) => [g.base, ...g.rules.map((r) => String(r.unit))]));
    for (const unit of units) {
        const id = String(unit._id);
        if (assigned.has(id)) continue;
        if (unit.measureType === 'mass' || unit.measureType === 'volume') {
            report.unitsUnassigned.push({
                unit: unit.longSingular,
                reason: `${unit.measureType} unit with no known size and no sized conversion group`,
            });
        } else if (inGroup.has(id)) {
            report.unitsUnassigned.push({
                unit: unit.longSingular,
                reason: 'in a conversion group with no unit of known size',
            });
        } else {
            // A unit with no measure type is a pinch, a clove or a can: it reaches grams
            // only through a measure recorded for that exact unit.
            assigned.set(id, {
                dimension: 'count',
                perCanonical: 1,
                system: null,
                source: 'no known size, assumed count',
            });
            report.unitsAssumedCount.push(unit.longSingular);
        }
    }

    for (const unit of units) {
        const magnitude = assigned.get(String(unit._id));
        if (!magnitude || magnitude.source === 'existing') continue;
        report.unitsAssigned.push({ unit: unit.longSingular, ...magnitude });
        if (write) {
            const { dimension, perCanonical, system } = magnitude;
            await db
                .collection('units')
                .updateOne(
                    { _id: unit._id },
                    { $set: { dimension, perCanonical, system, hidden: unit.hidden ?? false } }
                );
        }
    }
    return { units, byId, assigned, rules, conversions };
}

/** Phase 3a: the `each` unit that replaces a quantity with no unit. */
async function ensureEachUnit(db: Db, report: MigrationReport, write: boolean, admin?: ObjectId) {
    const fields = { dimension: 'count', perCanonical: 1, system: null, hidden: true };
    const existing = await db.collection<LegacyUnit>('units').findOne({ longSingular: 'each' });
    if (existing) {
        report.eachUnit = 'updated';
        if (write) {
            await db.collection('units').updateOne({ _id: existing._id }, { $set: fields });
        }
        return existing._id;
    }
    if (!admin) {
        report.eachUnit = 'missing admin';
        return null;
    }
    report.eachUnit = 'created';
    const each = {
        _id: new Types.ObjectId(),
        shortSingular: 'ea',
        shortPlural: 'ea',
        longSingular: 'each',
        longPlural: 'each',
        preferredNumberFormat: 'fraction',
        hasSpace: true,
        unique: true,
        owner: admin,
        ...fields,
    };
    if (write) {
        await db.collection('units').insertOne(each);
    }
    return each._id;
}

/** Phase 3b: "2 onions" becomes 2 each. A line with no quantity keeps no unit. */
async function rewriteUnitlessCounts(
    db: Db,
    report: MigrationReport,
    write: boolean,
    each: ObjectId
) {
    const [counted] = await db
        .collection('recipes')
        .aggregate<{ lines: number }>([
            { $unwind: '$ingredientSubsections' },
            { $unwind: '$ingredientSubsections.ingredients' },
            {
                $match: {
                    'ingredientSubsections.ingredients.quantity': { $ne: null },
                    'ingredientSubsections.ingredients.unit': null,
                },
            },
            { $count: 'lines' },
        ])
        .toArray();
    report.recipeLinesRewritten = counted?.lines ?? 0;
    if (write && report.recipeLinesRewritten > 0) {
        await db
            .collection('recipes')
            .updateMany(
                {},
                { $set: { 'ingredientSubsections.$[].ingredients.$[line].unit': each } },
                { arrayFilters: [{ 'line.quantity': { $ne: null }, 'line.unit': null }] }
            );
    }
}

async function upsertMeasure(
    db: Db,
    write: boolean,
    ingredient: ObjectId,
    unit: ObjectId,
    grams: number
): Promise<boolean> {
    const key = { ingredient, unit, size: null, prepMethod: null };
    const existing = await db.collection('ingredientmeasures').findOne(key);
    if (existing) return false;
    if (write) {
        await db.collection('ingredientmeasures').insertOne({ ...key, grams, __v: 0 });
    }
    return true;
}

/** Phases 1 and 3: densities become millilitre rows and perUnit becomes `each` rows. */
async function migrateMeasures(
    db: Db,
    report: MigrationReport,
    write: boolean,
    assigned: Map<string, Magnitude>,
    each: ObjectId | null
) {
    const millilitre = [...assigned.entries()].find(
        ([, m]) => m.dimension === 'volume' && m.perCanonical === 1 && m.system === 'metric'
    );
    const ingredients = await db
        .collection<{ _id: ObjectId; name: string; density?: number }>('ingredients')
        .find()
        .toArray();
    const names = new Map(ingredients.map((i) => [String(i._id), i.name]));

    for (const ingredient of ingredients) {
        if (ingredient.density == null) continue;
        if (!(ingredient.density > 0)) {
            report.densityNotMigrated.push({
                ingredient: ingredient.name,
                reason: `density ${ingredient.density} is not positive`,
            });
        } else if (!millilitre) {
            report.densityNotMigrated.push({
                ingredient: ingredient.name,
                reason: 'no metric volume unit of size 1 (millilitre)',
            });
        } else if (
            await upsertMeasure(
                db,
                write,
                ingredient._id,
                new Types.ObjectId(millilitre[0]),
                ingredient.density
            )
        ) {
            report.densityMeasuresCreated++;
        }
    }

    const infos = await db
        .collection<{ _id: ObjectId; ingredient: ObjectId; perGram?: Macros; perUnit?: Macros }>(
            'nutritionalinfos'
        )
        .find({ perUnit: { $type: 'object' } })
        .toArray();
    for (const info of infos) {
        const name = names.get(String(info.ingredient)) ?? String(info.ingredient);
        const perGram = info.perGram;
        const perUnit = info.perUnit!;
        // perUnit was stored as perGram × a portion weight, so the largest macro recovers
        // that weight with the least rounding error.
        const macro = perGram
            ? (['calories', 'protein', 'carbs', 'fat'] as const)
                  .filter((key) => perGram[key] > 0)
                  .sort((a, b) => perGram[b] - perGram[a])[0]
            : undefined;
        if (!each) {
            report.perUnitNotMigrated.push({ ingredient: name, reason: 'no each unit' });
        } else if (!perGram || !macro) {
            report.perUnitNotMigrated.push({
                ingredient: name,
                reason: 'no per-gram macros to recover the item weight from',
            });
        } else {
            const grams = Math.round((perUnit[macro] / perGram[macro]) * 100) / 100;
            if (!(grams > 0)) {
                report.perUnitNotMigrated.push({
                    ingredient: name,
                    reason: `per-unit ${macro} is 0`,
                });
            } else {
                if (await upsertMeasure(db, write, info.ingredient, each, grams)) {
                    report.countMeasuresCreated++;
                }
            }
        }
    }
}

/** Phase 4: one ladder per conversion group, thresholds moved into canonical units. */
async function migrateLadders(
    db: Db,
    report: MigrationReport,
    write: boolean,
    state: Awaited<ReturnType<typeof assignUnitMagnitudes>>,
    admin?: ObjectId
) {
    if (!admin) return;
    const { byId, assigned, rules, conversions } = state;
    const ladders = db.collection('displayladders');
    const taken = new Set<string>(await ladders.distinct('name'));
    const covered = new Set(
        (await ladders.find({ scope: 'global' }).toArray()).map((l) => `${l.dimension}-${l.system}`)
    );

    const create = async (
        dimension: UnitDimension,
        system: UnitSystem,
        steps: Array<{ unit: ObjectId; minCanonical: number }>
    ) => {
        let name = `${system}-${dimension}`;
        for (let i = 2; taken.has(name); i++) name = `${system}-${dimension}-${i}`;
        taken.add(name);
        covered.add(`${dimension}-${system}`);
        report.laddersCreated.push(name);
        steps.sort((a, b) => b.minCanonical - a.minCanonical);
        if (write) {
            await ladders.insertOne({
                name,
                dimension,
                system,
                scope: 'global',
                owner: admin,
                steps,
                __v: 0,
            });
        }
    };

    for (const conversion of conversions) {
        const baseId = String(conversion.baseUnit);
        const base = assigned.get(baseId);
        const label = `group of ${unitName(byId.get(baseId))}`;
        if (!base || base.dimension === 'count' || !base.system) {
            report.ladderStepsDropped.push({
                ladder: label,
                unit: unitName(byId.get(baseId)),
                reason: 'base unit has no mass or volume size',
            });
            continue;
        }
        if (covered.has(`${base.dimension}-${base.system}`)) continue;
        const steps = [{ unit: conversion.baseUnit, minCanonical: 0 }];
        for (const rule of rules.filter((r) => String(r.baseUnit) === baseId)) {
            const magnitude = assigned.get(String(rule.unit));
            if (magnitude?.dimension !== base.dimension || magnitude.system !== base.system) {
                report.ladderStepsDropped.push({
                    ladder: label,
                    unit: unitName(byId.get(String(rule.unit))),
                    reason: `not a ${base.system} ${base.dimension} unit`,
                });
                continue;
            }
            steps.push({
                unit: rule.unit,
                minCanonical: rule.baseUnitThreshold * base.perCanonical,
            });
        }
        await create(base.dimension, base.system, steps);
    }

    // A metric ladder per dimension, and a US mass ladder, when the conversion groups did
    // not already make one. Without a ladder a reader's system preference cannot convert.
    const defaults: Array<[UnitDimension, UnitSystem, number, number]> = [
        ['mass', 'metric', 1000, 1],
        ['volume', 'metric', 1000, 1],
        ['mass', 'us', 453.59237, 28.349523125],
    ];
    for (const [dimension, system, large, small] of defaults) {
        if (covered.has(`${dimension}-${system}`)) continue;
        const find = (size: number) =>
            [...assigned.entries()].find(
                ([, m]) =>
                    m.dimension === dimension && m.system === system && m.perCanonical === size
            )?.[0];
        const largeId = find(large);
        const smallId = find(small);
        if (!largeId || !smallId) continue;
        await create(dimension, system, [
            { unit: new Types.ObjectId(largeId), minCanonical: large },
            { unit: new Types.ObjectId(smallId), minCanonical: 0 },
        ]);
    }
}

/** Phases 5 and 6: drop the fields and collections nothing reads any more. */
async function dropLegacyData(db: Db, report: MigrationReport, write: boolean) {
    const ingredients = new Map(
        (await db.collection<{ _id: ObjectId; name: string }>('ingredients').find().toArray()).map(
            (i) => [String(i._id), i.name]
        )
    );
    const withoutPerGram = await db
        .collection<{ _id: ObjectId; ingredient: ObjectId }>('nutritionalinfos')
        .find({ perGram: { $not: { $type: 'object' } } })
        .toArray();
    for (const info of withoutPerGram) {
        report.nutritionalInfosRemoved.push({
            ingredient: ingredients.get(String(info.ingredient)) ?? String(info.ingredient),
            reason: 'no per-gram macros; per-unit macros alone cannot price a quantity',
        });
    }
    const existing = new Set((await db.listCollections().toArray()).map((c) => c.name));
    report.collectionsDropped = ['unitconversions', 'conversionrules'].filter((name) =>
        existing.has(name)
    );
    if (!write) return;
    await db
        .collection('nutritionalinfos')
        .deleteMany({ _id: { $in: withoutPerGram.map((i) => i._id) } });
    // An unsized unit keeps its measure type, so a re-run still reports it as unsized.
    await db
        .collection('units')
        .updateMany({ dimension: { $exists: true } }, { $unset: { measureType: '' } });
    await db.collection('ingredients').updateMany({}, { $unset: { density: '' } });
    await db.collection('nutritionalinfos').updateMany({}, { $unset: { perUnit: '' } });
    for (const name of report.collectionsDropped) {
        await db.dropCollection(name);
    }
}

export async function migrateCanonicalUnits(
    db: Db,
    options: MigrationOptions = {}
): Promise<MigrationReport> {
    const write = !options.dryRun;
    const report: MigrationReport = {
        dryRun: !write,
        unitsAssigned: [],
        unitsAlreadyAssigned: [],
        unitsUnassigned: [],
        unitsAssumedCount: [],
        eachUnit: 'missing admin',
        recipeLinesRewritten: 0,
        densityMeasuresCreated: 0,
        densityNotMigrated: [],
        countMeasuresCreated: 0,
        perUnitNotMigrated: [],
        laddersCreated: [],
        ladderStepsDropped: [],
        nutritionalInfosRemoved: [],
        collectionsDropped: [],
    };
    const admin = (await db.collection('users').findOne({ role: 'admin' }))?._id as
        | ObjectId
        | undefined;

    const state = await assignUnitMagnitudes(db, report, write);
    const each = await ensureEachUnit(db, report, write, admin);
    if (each) {
        await rewriteUnitlessCounts(db, report, write, each);
    }
    await migrateMeasures(db, report, write, state.assigned, each);
    await migrateLadders(db, report, write, state, admin);
    await dropLegacyData(db, report, write);
    return report;
}

function printReport(report: MigrationReport) {
    const list = <T>(title: string, items: T[], format: (item: T) => string) => {
        console.log(`\n${title}: ${items.length}`);
        for (const item of items) console.log(`  - ${format(item)}`);
    };
    console.log(report.dryRun ? 'DRY RUN: nothing was written.' : 'Migration complete.');
    list(
        'Units sized',
        report.unitsAssigned,
        (u) =>
            `${u.unit}: ${u.dimension} × ${u.perCanonical}${u.system ? ` (${u.system})` : ''}, from ${u.source}`
    );
    list('Units already sized', report.unitsAlreadyAssigned, (u) => u);
    list(
        'Units NOT sized, need an owner to set them',
        report.unitsUnassigned,
        (u) => `${u.unit}: ${u.reason}`
    );
    list('Units assumed to be count units, check each one', report.unitsAssumedCount, (u) => u);
    console.log(`\neach unit: ${report.eachUnit}`);
    console.log(`Recipe lines rewritten to each: ${report.recipeLinesRewritten}`);
    console.log(`Density measures created: ${report.densityMeasuresCreated}`);
    list(
        'Densities NOT migrated',
        report.densityNotMigrated,
        (d) => `${d.ingredient}: ${d.reason}`
    );
    console.log(`Count measures created from perUnit: ${report.countMeasuresCreated}`);
    list('perUnit NOT migrated', report.perUnitNotMigrated, (d) => `${d.ingredient}: ${d.reason}`);
    list('Display ladders created', report.laddersCreated, (l) => l);
    list(
        'Ladder steps dropped',
        report.ladderStepsDropped,
        (s) => `${s.ladder}: ${s.unit}, ${s.reason}`
    );
    list(
        'Nutritional infos removed',
        report.nutritionalInfosRemoved,
        (n) => `${n.ingredient}: ${n.reason}`
    );
    list('Collections dropped', report.collectionsDropped, (c) => c);
}

async function main() {
    const uri = process.env.MONGODB_URI;
    if (!uri) {
        console.error('Set MONGODB_URI to the database to migrate.');
        process.exit(1);
    }
    await mongoose.connect(uri);
    try {
        const report = await migrateCanonicalUnits(mongoose.connection.db, {
            dryRun: Boolean(process.env.DRY_RUN),
        });
        printReport(report);
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
