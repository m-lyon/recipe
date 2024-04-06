import 'dotenv-flow/config';
import mongoose from '../utils/database.js';
import { populateUnits } from '../utils/populate.js';
import { populatePrepMethods } from '../utils/populate.js';
import { populateIngredients } from '../utils/populate.js';
import { populateImages, populateRecipes, populateTags } from '../utils/populate.js';

async function populateData() {
    await populateTags();
    await populateUnits();
    await populatePrepMethods();
    await populateIngredients();
    await populateRecipes();
    await populateImages();
    mongoose.disconnect();
}

populateData();
