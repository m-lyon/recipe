import 'dotenv-flow/config';
import mongoose from '../utils/connectdb.js';
import { populateTags } from '../utils/populatedb.js';
import { populateUnits } from '../utils/populatedb.js';
import { populatePrepMethods } from '../utils/populatedb.js';
import { populateIngredients } from '../utils/populatedb.js';

async function populateData() {
    await populateTags();
    await populateUnits();
    await populatePrepMethods();
    await populateIngredients();
    mongoose.disconnect();
}

populateData();
