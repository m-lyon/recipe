/* eslint-env mongo */
const collectionName = process.env.COLLECTION;
if (!collectionName) {
    print('Error: Please provide a collection name as an argument.');
    quit(1);
}
const db = db.getSiblingDB(collectionName);

// Step 1: Iterate over all documents in the collection that have 'ingredientSubsections'
db.recipes.find({ ingredientSubsections: { $exists: true } }).forEach((doc) => {
    let updated = false;

    // Step 2: Iterate over each 'ingredientSubsection' in the document
    doc.ingredientSubsections.forEach((subsection) => {
        // Step 3: Iterate over each 'ingredient' in the subsection and add the 'size' field
        subsection.ingredients.forEach((ingredient) => {
            if (!Object.prototype.hasOwnProperty.call(ingredient, 'size')) {
                ingredient.size = null; // Set the 'size' field to null
                updated = true; // Flag that we need to update this document
            }
        });
    });

    // Step 4: Update the document in the database if changes were made
    if (updated) {
        db.recipes.updateOne(
            { _id: doc._id },
            { $set: { ingredientSubsections: doc.ingredientSubsections } }
        );
        print(`Updated document with _id: ${doc._id}`);
    } else {
        print(`No changes needed for document with _id: ${doc._id}`);
    }
});

print('Field update complete.');

// example of running the script
// COLLECTION=recipeProdBackup mongosh "mongodb://localhost:27017" updateSchema_2024-09-13.js
