/* eslint-env mongo */
const collectionName = process.env.COLLECTION;
if (!collectionName) {
    print('Error: Please provide a collection name via COLLECTION env var.');
    quit(1);
}
const db = db.getSiblingDB(collectionName);

const result = db.recipes.updateMany(
    { $or: [{ activeTime: { $exists: false } }, { passiveTime: { $exists: false } }] },
    { $set: { activeTime: null, passiveTime: null } }
);

print(`Migration complete. Updated ${result.modifiedCount} document(s).`);

// Usage:
// COLLECTION=recipeDb mongosh "mongodb://localhost:27017" updateSchema_2026-03-30.js
