/* eslint-env mongo */
const collectionName = process.env.COLLECTION;
if (!collectionName) {
    print('Error: Please provide a collection name as an argument.');
    quit(1);
}
const db = db.getSiblingDB(collectionName);

// --------------------------------------------------------------------------
// Calorie counting feature (issue #73)
//
// - NutritionalInfo is a brand-new collection — no migration required.
// - Unit.measureType is a nullable field that defaults to null for existing
//   documents, so no backfill is needed.
//
// This script is a no-op placeholder for the record.
// --------------------------------------------------------------------------

print('No migration needed for calorie counting feature.');
print('  - NutritionalInfo: new collection, starts empty.');
print('  - Unit.measureType: nullable, existing docs default to null.');
print('Done.');

// example of running the script
// COLLECTION=recipeProdBackup mongosh "mongodb://localhost:27017" updateSchema_2026-03-29.js
