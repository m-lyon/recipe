import { Types, mongo } from 'mongoose';

import { STANDARD_UNITS, StandardUnit, standardUnitNames } from './units.js';

type Db = mongo.Db;
type ObjectId = Types.ObjectId;

interface StoredUnit {
    _id: ObjectId;
    shortSingular: string;
    shortPlural: string;
    longSingular: string;
    longPlural: string;
    owner: ObjectId;
    unique?: boolean;
    measureType?: string | null;
    dimension?: string;
    perCanonical?: number;
    system?: string | null;
    hidden?: boolean;
    standard?: string | null;
}

export interface StandardUnitReport {
    /** Core standard units that were missing and are now created. */
    created: string[];
    /** Existing units matched by name and marked as a standard unit. */
    adopted: Array<{ unit: string; changed: string[] }>;
    /** Standard units whose stored fields no longer matched the code, now corrected. */
    corrected: Array<{ unit: string; changed: string[] }>;
    /** Units that share a name with a standard unit but were left as they are. */
    skipped: Array<{ unit: string; reason: string }>;
    /** True when a missing unit could not be created or owned, because there is no admin. */
    missingAdmin: boolean;
}

function names(unit: StoredUnit): string[] {
    return [unit.shortSingular, unit.shortPlural, unit.longSingular, unit.longPlural]
        .filter(Boolean)
        .map((name) => name.toLowerCase());
}

/** Why a unit cannot become this standard unit, or null when it can. */
function conflict(unit: StoredUnit, definition: StandardUnit): string | null {
    if (unit.unique === false) {
        return 'a bespoke unit of one user';
    }
    const dimension = unit.dimension ?? unit.measureType;
    if (dimension && dimension !== definition.dimension) {
        return `a ${dimension} unit, but ${definition.longSingular} is ${definition.dimension}`;
    }
    return null;
}

/**
 * Makes the units collection agree with STANDARD_UNITS. A standard unit is found by its
 * `standard` key, or else adopted from an existing unit with one of its names, so recipes,
 * measures and ladders keep the ids they already hold. Missing core units are created and
 * owned by an admin, so every reader can see them. Only the fields that define a unit's
 * size are corrected; how a unit is written stays as it is. Safe to run on every start.
 */
export async function syncStandardUnits(
    db: Db,
    options: { write?: boolean } = {}
): Promise<StandardUnitReport> {
    const write = options.write ?? true;
    const report: StandardUnitReport = {
        created: [],
        adopted: [],
        corrected: [],
        skipped: [],
        missingAdmin: false,
    };
    const collection = db.collection<StoredUnit>('units');
    const admins = await db
        .collection('users')
        .find({ role: 'admin' }, { projection: { _id: 1 } })
        .toArray();
    const adminIds = new Set(admins.map((admin) => String(admin._id)));
    const admin = admins[0]?._id as ObjectId | undefined;
    const units = await collection.find().toArray();
    const claimed = new Set(units.filter((u) => u.standard).map((u) => String(u._id)));

    for (const definition of STANDARD_UNITS) {
        const wanted = new Set(standardUnitNames(definition));
        let unit = units.find((u) => u.standard === definition.key);
        let adopted = false;
        if (!unit) {
            // Prefer a unit every reader already sees: one owned by an admin.
            const candidates = units
                .filter((u) => !claimed.has(String(u._id)) && names(u).some((n) => wanted.has(n)))
                .sort(
                    (a, b) =>
                        Number(adminIds.has(String(b.owner))) -
                        Number(adminIds.has(String(a.owner)))
                );
            for (const candidate of candidates) {
                const reason = conflict(candidate, definition);
                if (reason) {
                    report.skipped.push({ unit: candidate.longSingular, reason });
                } else if (!unit) {
                    unit = candidate;
                    adopted = true;
                } else {
                    report.skipped.push({
                        unit: candidate.longSingular,
                        reason: `a second ${definition.longSingular}; the standard unit is ${String(unit._id)}`,
                    });
                }
            }
        }

        if (!unit) {
            if (!definition.core) continue;
            // A bespoke unit is private to its owner, so it does not block a standard one.
            const clash = units.find(
                (u) =>
                    u.unique !== false &&
                    !claimed.has(String(u._id)) &&
                    names(u).some((n) => wanted.has(n))
            );
            if (clash) {
                report.skipped.push({
                    unit: definition.longSingular,
                    reason: `not created: ${clash.longSingular} already uses one of its names`,
                });
                continue;
            }
            if (!admin) {
                report.missingAdmin = true;
                continue;
            }
            report.created.push(definition.longSingular);
            if (write) {
                await collection.insertOne({
                    _id: new Types.ObjectId(),
                    shortSingular: definition.shortSingular,
                    shortPlural: definition.shortPlural,
                    longSingular: definition.longSingular,
                    longPlural: definition.longPlural,
                    preferredNumberFormat: definition.preferredNumberFormat,
                    hasSpace: definition.hasSpace,
                    unique: true,
                    owner: admin,
                    dimension: definition.dimension,
                    perCanonical: definition.perCanonical,
                    system: definition.system,
                    hidden: definition.hidden,
                    standard: definition.key,
                    __v: 0,
                } as StoredUnit);
            }
            continue;
        }

        claimed.add(String(unit._id));
        const fields: Partial<StoredUnit> = {
            standard: definition.key,
            dimension: definition.dimension,
            perCanonical: definition.perCanonical,
            system: definition.system,
            hidden: definition.hidden,
        };
        if (!adminIds.has(String(unit.owner))) {
            if (admin) {
                fields.owner = admin;
            } else {
                report.missingAdmin = true;
            }
        }
        const changed = (Object.keys(fields) as Array<keyof StoredUnit>).filter(
            (field) => String(unit[field] ?? null) !== String(fields[field] ?? null)
        );
        if (changed.length === 0) continue;
        (adopted ? report.adopted : report.corrected).push({ unit: unit.longSingular, changed });
        if (write) {
            await collection.updateOne({ _id: unit._id }, { $set: fields });
        }
    }
    return report;
}

/**
 * One line per change, for logs. Empty when nothing changed. Skipped units are left out
 * unless asked for, because they repeat on every run.
 */
export function describeStandardUnitReport(
    report: StandardUnitReport,
    options: { skipped?: boolean } = {}
): string[] {
    return [
        ...report.created.map((unit) => `created ${unit}`),
        ...report.adopted.map((a) => `adopted ${a.unit} (${a.changed.join(', ')})`),
        ...report.corrected.map((c) => `corrected ${c.unit} (${c.changed.join(', ')})`),
        ...(options.skipped ? report.skipped.map((s) => `skipped ${s.unit}: ${s.reason}`) : []),
        ...(report.missingAdmin ? ['no admin user: some standard units were not created'] : []),
    ];
}
