import 'dotenv-flow/config';
import mongoose from '../utils/connectdb.js';
import { populateRecipes, populateTags } from '../utils/populatedb.js';
import { populateUnits, populatePrepMethods } from '../utils/populatedb.js';
import { populateIngredients, populateUsers } from '../utils/populatedb.js';

async function populateData() {
    await populateUsers();
    await populateTags();
    await populateUnits();
    await populatePrepMethods();
    await populateIngredients();
    await populateRecipes();
    mongoose.disconnect();
}

populateData();
