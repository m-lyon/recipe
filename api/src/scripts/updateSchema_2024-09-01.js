// Step 1: Get the database name from the command-line arguments
const collectionName = process.env.COLLECTION_NAME;
if (!collectionName) {
    print('Error: Please provide a collection name as an argument.');
    quit(1);
}
const db = db.getSiblingDB(collectionName);

// Step 2: Set the 'unique' field in each unit document to true
db.units.updateMany({}, { $set: { unique: true } });
db.prepmethods.updateMany({}, { $set: { unique: true } });

print('Transformation complete.');

// example of running the script
// COLLECTION_NAME=recipeProdBackup mongosh "mongodb://localhost:27017" updateSchema.js
