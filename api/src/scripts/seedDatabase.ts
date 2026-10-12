import 'dotenv-flow/config';
import '../requireEnv.js';
import mongoose from '../utils/database.js';
import { populateSizes, populateUnits } from '../utils/populate.js';
import { populateIngredients, populateNutritionalInfo } from '../utils/populate.js';
import { populateRatings, populateRecipes, populateTags } from '../utils/populate.js';
import { populateIngredientMeasures, populatePrepMethods } from '../utils/populate.js';
import { populateDisplayLadders, populateImages, populateUsers } from '../utils/populate.js';

/** Replaces the development database with the data in utils/seedData.ts. */
async function populateData() {
    await mongoose.connection.asPromise();
    console.log(`Seeding ${mongoose.connection.name}`);
    await populateUsers();
    await populateTags();
    await populateUnits();
    await populateSizes();
    await populatePrepMethods();
    await populateIngredients();
    await populateNutritionalInfo();
    await populateIngredientMeasures();
    await populateDisplayLadders();
    await populateRecipes();
    await populateRatings();
    await populateImages();
    console.log('Done. Log in as john@gmail.com (admin) or matt@gmail.com, password password1.');
}

populateData()
    .catch((error) => {
        console.error('Seeding failed:', error);
        process.exitCode = 1;
    })
    .finally(() => mongoose.disconnect());
