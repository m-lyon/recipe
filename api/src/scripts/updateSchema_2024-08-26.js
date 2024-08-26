// Step 1: Get the database name from the command-line arguments
const collectionName = process.env.COLLECTION_NAME;
if (!collectionName) {
    print('Error: Please provide a collection name as an argument.');
    quit(1);
}
const db = db.getSiblingDB(collectionName);

// Step 2: Fetch all documents with an 'instructions' field in the 'recipeProdBackup' collection
const instructionCursor = db.recipes.find({ instructions: { $exists: true } });
print(instructionCursor.count() + ' documents found with an "instructions" field.');

// Step 3: Iterate through each document and transform the instructions
instructionCursor.forEach((doc) => {
    // Check if 'instructions' is an array
    if (Array.isArray(doc.instructions) && doc.instructions.length > 0) {
        // Create a new 'instructionSubsections' array with a single subsection
        const instructionSubsections = [
            {
                name: null, // No subsection name
                instructions: doc.instructions,
            },
        ];

        // Step 4: Update the document
        db.recipes.updateOne(
            { _id: doc._id }, // Match the document by its unique _id
            {
                $set: { instructionSubsections: instructionSubsections },
                $unset: { instructions: '' }, // Remove the old 'instructions' field
            }
        );

        print(`Updated document with _id: ${doc._id}`);
    } else {
        print(
            `Skipping document with _id: ${doc._id} because 'instructions' is not a valid array.`
        );
    }
});

// Step 5: Iterate over all documents in the collection
const ingredientCursor = db.recipes.find({ ingredients: { $exists: true } });
print(ingredientCursor.count() + ' documents found with an "ingredients" field.');
ingredientCursor.forEach((doc) => {
    if (Array.isArray(doc.ingredients) && doc.ingredients.length > 0) {
        // Step 6: Create a new array of 'IngredientSubsections'
        const ingredientSubsections = [
            {
                name: null, // Assuming no name for the subsection
                ingredients: doc.ingredients,
            },
        ];

        // Step 7: Update the document with the new 'ingredientSubsections' structure
        db.recipes.updateOne(
            { _id: doc._id },
            {
                $set: { ingredientSubsections: ingredientSubsections },
                $unset: { ingredients: '' }, // Optionally remove the old 'ingredients' field
            }
        );

        print(`Updated document with _id: ${doc._id}`);
    } else {
        print(`Skipping document with _id: ${doc._id} because 'ingredients' is not a valid array.`);
    }
});

print('Transformation complete.');
