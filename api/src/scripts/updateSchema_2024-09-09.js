/* eslint-env mongo */
const collectionName = process.env.COLLECTION;
if (!collectionName) {
    print('Error: Please provide a collection name as an argument.');
    quit(1);
}
const db = db.getSiblingDB(collectionName);
db.recipes.createIndex({ title: 'text' });
print(db.recipes.getIndexes());
print('Transformation complete.');

// example of running the script
// COLLECTION=recipeProdBackup mongosh "mongodb://localhost:27017" updateSchema.js
