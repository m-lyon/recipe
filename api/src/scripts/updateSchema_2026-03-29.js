/* eslint-env mongo */
const collectionName = process.env.COLLECTION;
if (!collectionName) {
    print('Error: Please provide a collection name as an argument.');
    quit(1);
}
const db = db.getSiblingDB(collectionName);

db.recipes.find({ prepAhead: { $exists: false } }).forEach((doc) => {
    db.recipes.updateOne({ _id: doc._id }, { $set: { prepAhead: false } });
    print(`Updated document with _id: ${doc._id}`);
});

print('prepAhead field update complete.');

// Run with:
// COLLECTION=dbName mongosh "mongodb://localhost:27017" updateSchema_2026-03-29.js
