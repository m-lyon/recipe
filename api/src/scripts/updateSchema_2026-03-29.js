/* eslint-env mongo */
const collectionName = process.env.COLLECTION;
if (!collectionName) {
    print('Error: Please provide a collection name as an argument.');
    quit(1);
}
const db = db.getSiblingDB(collectionName);

// Set yield: null on all existing recipe documents that don't have the field
let updatedCount = 0;
db.recipes.find({ yield: { $exists: false } }).forEach((doc) => {
    db.recipes.updateOne({ _id: doc._id }, { $set: { yield: null } });
    updatedCount++;
    print(`Updated document with _id: ${doc._id}`);
});

print(`Migration complete. Updated ${updatedCount} document(s).`);

// Example usage:
// COLLECTION=recipeProdBackup mongosh "mongodb://localhost:27017" updateSchema_2026-03-29.js
