import 'dotenv/config.js';
import mongoose from '../utils/connectdb.js';
import { Tag } from '../models/Tag.js';
import { Unit } from '../models/Unit.js';
import { Ingredient } from '../models/Ingredient.js';
import { PrepMethod } from '../models/PrepMethod.js';

async function populateTags() {
    try {
        // Remove all existing tags
        await Tag.deleteMany({});

        // Create new dummy records
        const dummyTags = ['Lunch', 'Dinner', 'Spicy', 'Freezes'];
        const createdTags = await Tag.create(dummyTags.map((value) => ({ value })));

        console.log('Dummy tags added:', createdTags);
    } catch (error) {
        console.error('Error populating tags:', error);
    }
}

async function populatePrepMethods() {
    try {
        // Remove all existing prep methods
        await PrepMethod.deleteMany({});

        // Create new dummy prep methods
        const dummyPrepMethods = ['sliced', 'chopped', 'diced', 'grated', 'shredded'];
        const createdPrepMethods = await PrepMethod.create(
            dummyPrepMethods.map((value) => ({ value }))
        );

        console.log('Dummy prep methods added:', createdPrepMethods);
    } catch (error) {
        console.error('Error populating prep methods:', error);
    }
}

async function populateUnits() {
    try {
        // Remove all existing units
        await Unit.deleteMany({});

        // Create new dummy units
        const dummyUnits = [
            { shortValue: 'g', longValue: 'grams' },
            { shortValue: 'cups', longValue: 'cups' },
            { shortValue: 'tsp', longValue: 'teaspoons' },
            { shortValue: 'tbsp', longValue: 'tablespoons' },
        ];
        const createdUnits = await Unit.create(dummyUnits);

        console.log('Dummy units added:', createdUnits);
    } catch (error) {
        console.error('Error populating units:', error);
    }
}

async function populateIngredients() {
    try {
        // Remove all existing ingredients
        await Ingredient.deleteMany({});

        // Retrieve prepMethod IDs by their values from the database
        const sliced = await PrepMethod.findOne({ value: 'sliced' });
        const chopped = await PrepMethod.findOne({ value: 'chopped' });
        const diced = await PrepMethod.findOne({ value: 'diced' });
        const shredded = await PrepMethod.findOne({ value: 'shredded' });

        // Create new dummy ingredients with associated prepMethods
        const dummyIngredients = [
            { name: 'Onion', prepMethods: [sliced._id, chopped._id] },
            { name: 'Tomato', prepMethods: [diced._id] },
            { name: 'Chicken', prepMethods: [shredded._id] },
        ];

        const createdIngredients = await Ingredient.create(dummyIngredients);

        console.log('Ingredients with prepMethods added:', createdIngredients);
    } catch (error) {
        console.error('Error populating ingredients:', error);
    }
}

async function populateData() {
    await populateTags();
    await populateUnits();
    await populatePrepMethods();
    await populateIngredients();
    mongoose.disconnect();
}

populateData();
