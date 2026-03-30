/* eslint-env mongo */
const collectionName = process.env.COLLECTION;
if (!collectionName) {
    print('Error: Please provide a collection name as an argument.');
    quit(1);
}
const db = db.getSiblingDB(collectionName);

// Set yield: null on all existing recipe documents that don't have the field
const result = db.recipes.updateMany({ yield: { $exists: false } }, { $set: { yield: null } });

print(`Migration complete. Updated ${result.modifiedCount} document(s).`);

// Example usage:
// COLLECTION=recipeProdBackup mongosh "mongodb://localhost:27017" updateSchema_2026-03-29.js
