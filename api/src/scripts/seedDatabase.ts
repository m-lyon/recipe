import 'dotenv-flow/config';
import mongoose from '../utils/connectdb.js';
import { populateRecipes, populateTags } from '../utils/populatedb.js';
import { populateUnits } from '../utils/populatedb.js';
import { populatePrepMethods } from '../utils/populatedb.js';
import { populateIngredients } from '../utils/populatedb.js';
import { populateUsers } from '../utils/populatedb.js';

async function populateData() {
    await populateTags();
    await populateUnits();
    await populatePrepMethods();
    await populateIngredients();
    await populateUsers();
    await populateRecipes();
    mongoose.disconnect();
}

populateData();
