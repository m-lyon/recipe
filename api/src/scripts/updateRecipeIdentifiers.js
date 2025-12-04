/* eslint-env mongo */
const collectionName = process.env.COLLECTION;
if (!collectionName) {
    print('Error: Please provide a collection name as an argument.');
    quit(1);
}
const db = db.getSiblingDB(collectionName);

/**
 * Generate a recipe identifier from the title
 * @param {string} title - The recipe title
 * @param {string} existingSuffix - Optional existing suffix to preserve
 * @returns {string} - The generated identifier
 */
function generateRecipeIdentifier(title, existingSuffix) {
    // Remove special characters
    let sanitizedTitle = title.replace(/[^a-zA-Z0-9\s]/g, '');
    // Remove leading and trailing whitespaces
    sanitizedTitle = sanitizedTitle.trim();
    // Replace spaces with dashes and convert to lowercase
    sanitizedTitle = sanitizedTitle.replace(/\s+/g, '-').toLowerCase();

    // Generate or use existing suffix
    const suffix = existingSuffix || generateRandomString(5);
    return `${sanitizedTitle}-${suffix}`;
}

/**
 * Generate a random string of specified length
 * @param {number} length - Length of the random string
 * @returns {string} - Random string
 */
function generateRandomString(length) {
    const characters = 'abcdefghijklmnopqrstuvwxyz';
    let result = '';
    for (let i = 0; i < length; i++) {
        const randomIndex = Math.floor(Math.random() * characters.length);
        result += characters.charAt(randomIndex);
    }
    return result;
}

/**
 * Extract the suffix from an existing titleIdentifier
 * @param {string} titleIdentifier - The existing titleIdentifier
 * @returns {string|undefined} - The suffix if found
 */
function extractSuffix(titleIdentifier) {
    if (!titleIdentifier) return undefined;
    const parts = titleIdentifier.split('-');
    if (parts.length > 0) {
        const lastPart = parts[parts.length - 1];
        // Check if the last part looks like a suffix (5 lowercase letters)
        if (/^[a-z]{5}$/.test(lastPart)) {
            return lastPart;
        }
    }
    return undefined;
}

// Step 1: Iterate over all recipes in the collection
let updatedCount = 0;
let skippedCount = 0;

db.recipes.find({}).forEach((doc) => {
    if (!doc.title) {
        print(`Skipping document with _id: ${doc._id} - no title found`);
        skippedCount++;
        return;
    }

    // Extract existing suffix if available
    const existingSuffix = extractSuffix(doc.titleIdentifier);

    // Generate new identifier
    const newIdentifier = generateRecipeIdentifier(doc.title, existingSuffix);

    // Check if update is needed
    if (doc.titleIdentifier !== newIdentifier) {
        // Update the document
        db.recipes.updateOne({ _id: doc._id }, { $set: { titleIdentifier: newIdentifier } });
        print(`Updated document with _id: ${doc._id}`);
        print(`  Old identifier: ${doc.titleIdentifier}`);
        print(`  New identifier: ${newIdentifier}`);
        updatedCount++;
    } else {
        print(`No changes needed for document with _id: ${doc._id}`);
        skippedCount++;
    }
});

print('\nUpdate complete.');
print(`Updated: ${updatedCount} recipes`);
print(`Skipped: ${skippedCount} recipes`);

// example of running the script
// COLLECTION=recipeProdBackup mongosh "mongodb://localhost:27017" updateRecipeIdentifiers.js
