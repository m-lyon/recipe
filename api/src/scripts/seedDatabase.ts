import 'dotenv-flow/config';
import mongoose from '../utils/database.js';
import { populatePrepMethods, populateUnits } from '../utils/populate.js';
import { populateIngredients, populateUsers } from '../utils/populate.js';
import { populateImages, populateRecipes, populateTags } from '../utils/populate.js';

async function populateData() {
    await populateUsers();
    await populateTags();
    await populateUnits();
    await populatePrepMethods();
    await populateIngredients();
    await populateRecipes();
    await populateImages();
    mongoose.disconnect();
}

populateData();
