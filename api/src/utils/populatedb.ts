import { Tag } from '../models/Tag.js';
import { Unit } from '../models/Unit.js';
import { User } from '../models/User.js';
import { Ingredient } from '../models/Ingredient.js';
import { PrepMethod } from '../models/PrepMethod.js';
import { Recipe } from '../models/Recipe.js';

export async function populateTags() {
    try {
        // Remove all existing tags
        await Tag.collection.drop();

        // Create new dummy records
        const dummyTags = ['lunch', 'dinner', 'spicy', 'freezes'];
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
                preferredNumberFormat: 'decimal',
            },
            {
                shortSingular: 'ml',
                shortPlural: 'ml',
                longSingular: 'millilitre',
                longPlural: 'millilitres',
                preferredNumberFormat: 'decimal',
            },
            {
                shortSingular: 'tsp',
                shortPlural: 'tsp',
                longSingular: 'teaspoon',
                longPlural: 'teaspoons',
                preferredNumberFormat: 'fraction',
            },
            {
                shortSingular: 'tbsp',
                shortPlural: 'tbsp',
                longSingular: 'tablespoon',
                longPlural: 'tablespoons',
                preferredNumberFormat: 'fraction',
            },
            {
                shortSingular: 'cup',
                shortPlural: 'cups',
                longSingular: 'cup',
                longPlural: 'cups',
                preferredNumberFormat: 'fraction',
            },
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

        const dummyIngredients = [
            { name: 'onion', pluralName: 'onions', isCountable: true },
            { name: 'tomato', pluralName: 'tomatoes', isCountable: true, density: 0.8 },
            { name: 'chicken', pluralName: 'chickens', isCountable: false, density: 1.0 },
        ];
        const createdIngredients = await Ingredient.create(dummyIngredients);

        console.log('Ingredients with prepMethods added:', createdIngredients);
    } catch (error) {
        console.error('Error populating ingredients:', error);
    }
}

export async function populateRecipes() {
    try {
        // Remove all existing recipes
        await Recipe.collection.drop();
        const dummyRecipes = [
            {
                title: 'Spaghetti Bolognese',
                subTitle: 'A classic Italian dish',
                tags: [
                    (await Tag.findOne({ value: 'lunch' }))._id,
                    (await Tag.findOne({ value: 'dinner' }))._id,
                ],
                ingredients: [
                    {
                        ingredient: (await Ingredient.findOne({ name: 'onion' }))._id,
                        type: 'ingredient',
                        quantity: '1',
                        unit: null,
                        prepMethod: (await PrepMethod.findOne({ value: 'chopped' }))._id,
                    },
                    {
                        ingredient: (await Ingredient.findOne({ name: 'chicken' }))._id,
                        type: 'ingredient',
                        quantity: '1',
                        unit: (await Unit.findOne({ shortSingular: 'kg' }))._id,
                        prepMethod: (await PrepMethod.findOne({ value: 'diced' }))._id,
                    },
                    {
                        ingredient: (await Ingredient.findOne({ name: 'tomato' }))._id,
                        type: 'ingredient',
                        quantity: '400',
                        unit: (await Unit.findOne({ shortSingular: 'cup' }))._id,
                        prepMethod: (await PrepMethod.findOne({ value: 'chopped' }))._id,
                    },
                ],
                instructions: [
                    'Heat a large pot of salted water over high heat. Once boiling, add the spaghetti and cook according to package instructions until al dente. Drain and set aside.',
                    'In a large skillet or saucepan, heat some olive oil over medium heat. Add the chopped onion, garlic, carrot, and celery. Sauté until softened, about 5-7 minutes.',
                    'Add the ground beef to the skillet. Break it apart with a spoon and cook until browned, stirring occasionally.',
                    'Once the beef is browned, add the canned chopped tomatoes, tomato paste, dried oregano, dried basil, dried thyme, and red pepper flakes (if using). Stir well to combine.',
                    'Reduce the heat to low and let the sauce simmer for about 20-30 minutes, stirring occasionally, until it thickens and the flavors meld together. Season with salt and pepper to taste.',
                    'Serve the bolognese sauce over the cooked spaghetti. Garnish with grated Parmesan cheese if desired.',
                    'Enjoy your delicious homemade spaghetti bolognese!',
                ],
                notes: 'This is a great recipe to make in bulk and freeze.',
                owner: (await User.findOne({ username: 'john@gmail.com' }))._id,
                source: 'Me Myself and I',
                numServings: 4,
                isIngredient: false,
            },
        ];
        const createdRecipes = await Recipe.create(dummyRecipes);
        console.log('Dummy recipes added:', createdRecipes);
    } catch (error) {
        console.error('Error populating recipes:', error);
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
