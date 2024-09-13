import 'dotenv-flow/config';
import mongoose from '../utils/database.js';
import { populateIngredients, populateUsers } from '../utils/populate.js';
import { populateImages, populateRecipes, populateTags } from '../utils/populate.js';
import { populatePrepMethods, populateSizes, populateUnits } from '../utils/populate.js';

async function populateData() {
    await populateUsers();
    await populateTags();
    await populateUnits();
    await populateSizes();
    await populateIngredients();
    await populatePrepMethods();
    await populateRecipes();
    await populateImages();
    mongoose.disconnect();
}

populateData();
