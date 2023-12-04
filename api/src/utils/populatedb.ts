import { Tag } from '../models/Tag.js';
import { Unit } from '../models/Unit.js';
import { User } from '../models/User.js';
import { Ingredient } from '../models/Ingredient.js';
import { PrepMethod } from '../models/PrepMethod.js';

export async function populateTags() {
    try {
        // Remove all existing tags
        await Tag.collection.drop();

        // Create new dummy records
        const dummyTags = ['Lunch', 'Dinner', 'Spicy', 'Freezes'];
        const createdTags = await Tag.create(dummyTags.map((value) => ({ value })));

        console.log('Dummy tags added:', createdTags);
    } catch (error) {
        console.error('Error populating tags:', error);
    }
}

export async function populatePrepMethods() {
    try {
        // Remove all existing prep methods
        await PrepMethod.collection.drop();

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

export async function populateUnits() {
    try {
        // Remove all existing units
        await Unit.collection.drop();

        // Create new dummy units
        const dummyUnits = [
            {
                shortSingular: 'kg',
                shortPlural: 'kg',
                longSingular: 'kilogram',
                longPlural: 'kilograms',
            },
            {
                shortSingular: 'ml',
                shortPlural: 'ml',
                longSingular: 'millilitre',
                longPlural: 'millilitres',
            },
            {
                shortSingular: 'tsp',
                shortPlural: 'tsp',
                longSingular: 'teaspoon',
                longPlural: 'teaspoons',
            },
            {
                shortSingular: 'tbsp',
                shortPlural: 'tbsp',
                longSingular: 'tablespoon',
                longPlural: 'tablespoons',
            },
            { shortSingular: 'cup', shortPlural: 'cups', longSingular: 'cup', longPlural: 'cups' },
        ];
        const createdUnits = await Unit.create(dummyUnits);

        console.log('Dummy units added:', createdUnits);
    } catch (error) {
        console.error('Error populating units:', error);
    }
}

export async function populateIngredients() {
    try {
        // Remove all existing ingredients
        await Ingredient.collection.drop();

        const dummyIngredients = [{ name: 'onion' }, { name: 'tomato' }, { name: 'chicken' }];
        const createdIngredients = await Ingredient.create(dummyIngredients);

        console.log('Ingredients with prepMethods added:', createdIngredients);
    } catch (error) {
        console.error('Error populating ingredients:', error);
    }
}

export async function populateUsers() {
    try {
        // Remove all existing users
        await User.collection.drop();

        const dummerUserDetails = [
            {
                username: 'john@gmail.com',
                firstName: 'John',
                lastName: 'Doe',
                role: 'admin',
            },
            {
                username: 'jane@gmail.com',
                firstName: 'Jane',
                lastName: 'Doe',
                role: 'user',
            },
        ];
        for (const user of dummerUserDetails) {
            await User.register(new User(user), 'password1');
        }
        console.log('Dummy user added:', dummerUserDetails);
    } catch (error) {
        console.error('Error populating users:', error);
    }
}
