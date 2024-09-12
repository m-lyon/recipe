/* eslint-env mongo */
const collectionName = process.env.COLLECTION_NAME;
if (!collectionName) {
    print('Error: Please provide a collection name as an argument.');
    quit(1);
}
const db = db.getSiblingDB(collectionName);

const res = db.recipes
    .aggregate([
        {
            $lookup: {
                from: 'prepmethods', // The collection name for PrepMethod
                localField: 'ingredientSubsections.ingredients.prepMethod',
                foreignField: '_id',
                as: 'prepMethods',
            },
        },
        {
            $match: {
                'prepMethods.value': 'torn into shreds', // Replace with the actual prepMethod value you're looking for
            },
        },
    ])
    .pretty();
print(res);
