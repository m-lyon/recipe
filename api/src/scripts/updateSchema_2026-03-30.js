/* eslint-env mongo */
const collectionName = process.env.COLLECTION;
if (!collectionName) {
    print('Error: Please provide a collection name as an argument.');
    quit(1);
}
const db = db.getSiblingDB(collectionName);

// Sets archived: false on all existing Recipe documents that lack the field.
const result = db.recipes.updateMany(
    { archived: { $exists: false } },
    { $set: { archived: false } }
);

print('\nMigration complete.');
print(`Matched: ${result.matchedCount} recipes`);
print(`Modified: ${result.modifiedCount} recipes`);

// example of running the script
// COLLECTION=recipeProdBackup mongosh "mongodb://localhost:27017" updateSchema_2026-03-30.js
