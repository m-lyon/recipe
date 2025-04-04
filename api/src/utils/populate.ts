import fs from 'fs';
import path from 'path';

import fetch from 'node-fetch';

import { Tag } from '../models/Tag.js';
import { Unit } from '../models/Unit.js';
import { User } from '../models/User.js';
import { Size } from '../models/Size.js';
import { Image } from '../models/Image.js';
import { IMAGE_DIR } from '../constants.js';
import { Recipe } from '../models/Recipe.js';
import { Ingredient } from '../models/Ingredient.js';
import { PrepMethod } from '../models/PrepMethod.js';

export async function populateTags() {
    try {
        // Remove all existing tags
        await Tag.collection.drop();

        // Create new dummy records
        const dummyTags = ['lunch', 'dinner', 'spicy', 'freezes', 'quick'];
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

        const admin = await User.findOne({ role: 'admin' });
        const user = await User.findOne({ role: 'user' });

        // Create new dummy prep methods
        const dummyPrepMethods = [
            { value: 'sliced', unique: true, owner: admin._id },
            { value: 'chopped', unique: true, owner: admin._id },
            { value: 'diced', unique: true, owner: admin._id },
            { value: 'grated', unique: true, owner: user._id },
            { value: 'shredded', unique: true, owner: user._id },
        ];
        const createdPrepMethods = await PrepMethod.create(dummyPrepMethods);

        console.log('Dummy prep methods added:', createdPrepMethods);
    } catch (error) {
        console.error('Error populating prep methods:', error);
    }
}

export async function populateUnits() {
    try {
        // Remove all existing units
        await Unit.collection.drop();

        const admin = await User.findOne({ role: 'admin' });
        const user = await User.findOne({ role: 'user' });

        // Create new dummy units
        const dummyUnits = [
            {
                shortSingular: 'kg',
                shortPlural: 'kg',
                longSingular: 'kilogram',
                longPlural: 'kilograms',
                preferredNumberFormat: 'decimal',
                hasSpace: true,
                unique: true,
                owner: admin._id,
            },
            {
                shortSingular: 'ml',
                shortPlural: 'ml',
                longSingular: 'millilitre',
                longPlural: 'millilitres',
                preferredNumberFormat: 'decimal',
                hasSpace: true,
                unique: true,
                owner: user._id,
            },
            {
                shortSingular: 'tsp',
                shortPlural: 'tsp',
                longSingular: 'teaspoon',
                longPlural: 'teaspoons',
                preferredNumberFormat: 'fraction',
                hasSpace: true,
                unique: true,
                owner: admin._id,
            },
            {
                shortSingular: 'tbsp',
                shortPlural: 'tbsp',
                longSingular: 'tablespoon',
                longPlural: 'tablespoons',
                preferredNumberFormat: 'fraction',
                hasSpace: true,
                unique: true,
                owner: admin._id,
            },
            {
                shortSingular: 'cup',
                shortPlural: 'cups',
                longSingular: 'cup',
                longPlural: 'cups',
                preferredNumberFormat: 'fraction',
                hasSpace: true,
                unique: true,
                owner: user._id,
            },
        ];
        const createdUnits = await Unit.create(dummyUnits);

        console.log('Dummy units added:', createdUnits);
    } catch (error) {
        console.error('Error populating units:', error);
    }
}

export async function populateSizes() {
    try {
        // Remove all existing sizes
        await Size.collection.drop();

        const admin = await User.findOne({ role: 'admin' });
        const user = await User.findOne({ role: 'user' });

        // Create new dummy sizes
        const dummySizes = [
            { value: 'small', unique: true, owner: admin._id },
            { value: 'medium', unique: true, owner: admin._id },
            { value: 'large', unique: true, owner: user._id },
        ];
        const createdSizes = await Size.create(dummySizes);

        console.log('Dummy sizes added:', createdSizes);
    } catch (error) {
        console.error('Error populating sizes:', error);
    }
}

export async function populateIngredients() {
    try {
        // Remove all existing ingredients
        await Ingredient.collection.drop();

        const admin = await User.findOne({ role: 'admin' });
        const user = await User.findOne({ role: 'user' });

        const dummyIngredients = [
            { name: 'onion', pluralName: 'onions', isCountable: true, owner: admin._id },
            {
                name: 'tomato',
                pluralName: 'tomatoes',
                isCountable: true,
                density: 0.8,
                owner: admin._id,
                tags: ['vegan', 'vegetarian'],
            },
            {
                name: 'chicken',
                pluralName: 'chickens',
                isCountable: false,
                density: 1.0,
                owner: admin._id,
                tags: [],
            },
            {
                name: 'beef',
                pluralName: 'beef',
                isCountable: false,
                density: 1.0,
                owner: user._id,
                tags: [],
            },
            {
                name: 'rice',
                pluralName: 'rice',
                isCountable: false,
                density: 0.6,
                owner: user._id,
                tags: ['vegan', 'vegetarian'],
            },
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

        const admin = await User.findOne({ role: 'admin' });
        const user = await User.findOne({ role: 'user' });

        const dummyRecipes = [
            {
                title: 'Spaghetti Bolognese',
                titleIdentifier: 'spaghetti-bolognese',
                subTitle: 'A classic Italian dish',
                tags: [
                    (await Tag.findOne({ value: 'lunch' }))._id,
                    (await Tag.findOne({ value: 'dinner' }))._id,
                    (await Tag.findOne({ value: 'freezes' }))._id,
                ],
                ingredientSubsections: {
                    ingredients: [
                        {
                            quantity: '1',
                            unit: null,
                            size: null,
                            ingredient: (await Ingredient.findOne({ name: 'onion' }))._id,
                            prepMethod: (await PrepMethod.findOne({ value: 'chopped' }))._id,
                        },
                        {
                            quantity: '1',
                            unit: (await Unit.findOne({ shortSingular: 'kg' }))._id,
                            size: (await Size.findOne({ value: 'medium' }))._id,
                            ingredient: (await Ingredient.findOne({ name: 'chicken' }))._id,
                            prepMethod: (await PrepMethod.findOne({ value: 'diced' }))._id,
                        },
                        {
                            quantity: '400',
                            unit: (await Unit.findOne({ shortSingular: 'cup' }))._id,
                            size: null,
                            ingredient: (await Ingredient.findOne({ name: 'tomato' }))._id,
                            prepMethod: (await PrepMethod.findOne({ value: 'chopped' }))._id,
                        },
                    ],
                },
                instructionSubsections: [
                    {
                        instructions: [
                            'Heat a large pot of salted water over high heat. Once boiling, add the spaghetti and cook according to package instructions until al dente. Drain and set aside.',
                            'In a large skillet or saucepan, heat some olive oil over medium heat. Add the chopped onion, garlic, carrot, and celery. Sauté until softened, about 5-7 minutes.',
                            'Add the ground beef to the skillet. Break it apart with a spoon and cook until browned, stirring occasionally.',
                            'Once the beef is browned, add the canned chopped tomatoes, tomato paste, dried oregano, dried basil, dried thyme, and red pepper flakes (if using). Stir well to combine.',
                            'Reduce the heat to low and let the sauce simmer for about 20-30 minutes, stirring occasionally, until it thickens and the flavors meld together. Season with salt and pepper to taste.',
                            'Serve the bolognese sauce over the cooked spaghetti. Garnish with grated Parmesan cheese if desired.',
                            'Enjoy your delicious homemade spaghetti bolognese!',
                        ],
                    },
                ],
                notes: 'This is a great recipe to make in bulk and freeze.',
                owner: admin._id,
                source: 'Me Myself and I',
                numServings: 4,
                isIngredient: false,
                createdAt: '2023-08-01T00:00:00.000Z',
                lastModified: '2023-08-01T00:00:00.000Z',
            },
            {
                title: 'Chicken Curry',
                titleIdentifier: 'chicken-curry',
                pluralTitle: 'Chicken Curry',
                subTitle: 'A classic Indian dish',
                tags: [
                    (await Tag.findOne({ value: 'lunch' }))._id,
                    (await Tag.findOne({ value: 'dinner' }))._id,
                    (await Tag.findOne({ value: 'spicy' }))._id,
                    (await Tag.findOne({ value: 'quick' }))._id,
                ],
                ingredientSubsections: [
                    {
                        name: 'Main Ingredients',
                        ingredients: [
                            {
                                quantity: '1/2',
                                unit: null,
                                size: null,
                                ingredient: (await Ingredient.findOne({ name: 'onion' }))._id,
                                prepMethod: (await PrepMethod.findOne({ value: 'sliced' }))._id,
                            },
                            {
                                quantity: '1',
                                unit: (await Unit.findOne({ shortSingular: 'kg' }))._id,
                                size: (await Size.findOne({ value: 'medium' }))._id,
                                ingredient: (await Ingredient.findOne({ name: 'chicken' }))._id,
                                prepMethod: (await PrepMethod.findOne({ value: 'diced' }))._id,
                            },
                            {
                                quantity: '400',
                                unit: (await Unit.findOne({ shortSingular: 'cup' }))._id,
                                size: (await Size.findOne({ value: 'small' }))._id,
                                ingredient: (await Ingredient.findOne({ name: 'tomato' }))._id,
                                prepMethod: (await PrepMethod.findOne({ value: 'chopped' }))._id,
                            },
                        ],
                    },
                    {
                        name: 'Sides',
                        ingredients: [
                            {
                                quantity: '2',
                                unit: (await Unit.findOne({ shortSingular: 'cup' }))._id,
                                size: null,
                                ingredient: (await Ingredient.findOne({ name: 'rice' }))._id,
                                prepMethod: null,
                            },
                        ],
                    },
                ],
                instructionSubsections: [
                    {
                        name: 'Main Instructions',
                        instructions: [
                            'Start by heating a large skillet or saucepan over medium heat. Add some vegetable oil or ghee.',
                            'Once the oil is hot, add chopped onions and sauté until they turn translucent, about 5-7 minutes.',
                            'Add minced garlic, ginger, and any other aromatics like chopped green chilies or curry leaves. Sauté for another 1-2 minutes until fragrant.',
                            'Next, add your chicken pieces to the skillet. You can use boneless, skinless chicken thighs or breasts cut into bite-sized pieces. Cook until the chicken is browned on all sides, stirring occasionally.',
                            'Now its time to add your spices. Sprinkle in curry powder, ground cumin, ground coriander, turmeric, and garam masala. Stir well to coat the chicken evenly with the spices.',
                            'Pour in some coconut milk or chicken broth to create a creamy base for the curry. Stir to combine.',
                            'Let the curry simmer over low heat for about 20-25 minutes, or until the chicken is fully cooked and tender. Stir occasionally to prevent sticking and ensure all flavors meld together.',
                            'If you like your curry thicker, you can mix a tablespoon of cornstarch with a splash of water and add it to the curry. Stir well and let it simmer for a few more minutes until thickened.',
                            'Season the curry with salt and pepper to taste. You can also add a squeeze of fresh lemon or lime juice for brightness, if desired.',
                            'Serve the chicken curry hot over steamed rice or with naan bread on the side. Garnish with fresh cilantro leaves or a dollop of yogurt, if desired.',
                            'Enjoy your delicious homemade chicken curry!',
                        ],
                    },
                ],
                notes: 'This is a great recipe to make in bulk and freeze.',
                owner: user._id,
                numServings: 3,
                isIngredient: true,
                createdAt: '2023-09-01T00:00:00.000Z',
                lastModified: '2023-09-01T00:00:00.000Z',
            },
            {
                title: 'Vegetarian Chili',
                titleIdentifier: 'vegetarian-chili',
                subTitle: 'A hearty and comforting dish',
                tags: [
                    (await Tag.findOne({ value: 'lunch' }))._id,
                    (await Tag.findOne({ value: 'dinner' }))._id,
                    (await Tag.findOne({ value: 'freezes' }))._id,
                ],
                ingredientSubsections: [
                    {
                        name: 'Main Ingredients',
                        ingredients: [
                            {
                                quantity: '1',
                                unit: null,
                                size: null,
                                ingredient: (await Ingredient.findOne({ name: 'onion' }))._id,
                                prepMethod: (await PrepMethod.findOne({ value: 'chopped' }))._id,
                            },
                            {
                                quantity: '400',
                                unit: (await Unit.findOne({ shortSingular: 'cup' }))._id,
                                size: null,
                                ingredient: (await Ingredient.findOne({ name: 'tomato' }))._id,
                                prepMethod: (await PrepMethod.findOne({ value: 'chopped' }))._id,
                            },
                        ],
                    },
                ],
                instructionSubsections: [
                    {
                        name: 'Main Instructions',
                        instructions: [
                            'Heat a large pot or Dutch oven over medium heat. Add a drizzle of olive oil.',
                            'Once the oil is hot, add the chopped onion, bell pepper, and garlic. Sauté until softened, about 5-7 minutes.',
                            'Add the diced tomatoes, tomato paste, and vegetable broth to the pot. Stir well to combine.',
                            'Next, add the drained and rinsed beans, corn, and diced bell pepper to the pot. Stir well to combine.',
                            'Season the chili with chili powder, cumin, paprika, oregano, and red pepper flakes. Stir well to combine.',
                        ],
                    },
                    {
                        name: 'Simmer and Serve',
                        instructions: [
                            'Bring the chili to a simmer over medium heat. Reduce the heat to low and let it simmer for about 20-30 minutes, stirring occasionally.',
                            'Serve the vegetarian chili hot with your favorite toppings, such as shredded cheese, sour cream, avocado, or fresh cilantro.',
                            'Enjoy your delicious homemade vegetarian chili!',
                        ],
                    },
                ],
                notes: 'This is a great recipe to make in bulk and freeze.',
                owner: user._id,
                numServings: 4,
                isIngredient: false,
                createdAt: '2023-09-02T00:00:00.000Z',
                lastModified: '2023-09-02T00:00:00.000Z',
            },
        ];

        const createdRecipes = await Recipe.create(dummyRecipes);
        console.log('Dummy recipes added:', createdRecipes);
    } catch (error) {
        console.error('Error populating recipes:', error);
    }
}

export async function populateImages() {
    try {
        // Remove all existing images
        await Image.collection.drop();
        // Remove files from the uploads folder
        fs.rmSync(IMAGE_DIR, { recursive: true });
        fs.mkdirSync(IMAGE_DIR);

        const recipe1 = await Recipe.findOne({ titleIdentifier: 'spaghetti-bolognese' });
        const recipe2 = await Recipe.findOne({ titleIdentifier: 'chicken-curry' });

        const dummyImages = [
            {
                origUrl: 'uploads/images/recipe1_image1.jpeg',
                recipe: recipe1._id,
                note: 'A picture of the finished dish',
            },
            {
                origUrl: 'uploads/images/recipe2_image1.jpeg',
                recipe: recipe2._id,
                note: 'A picture of the finished dish',
            },
            {
                origUrl: 'uploads/images/recipe2_image2.jpeg',
                recipe: recipe2._id,
            },
        ];

        const createdImages = await Image.create(dummyImages);

        // Download random images to the uploads folder
        for (const image of createdImages) {
            const destPath = path.join(IMAGE_DIR, path.basename(image.origUrl));
            await fetch(`https://picsum.photos/600/400`, { method: 'GET' }).then((res) => {
                const dest = fs.createWriteStream(destPath);
                res.body.pipe(dest);
                dest.on('finish', () => dest.close());
                dest.on('error', (err) => {
                    console.log('Error downloading image:', err);
                    fs.unlink(destPath, (err) => {
                        if (err) {
                            console.error('Error deleting image:', err);
                        }
                    });
                });
            });
        }
        console.log('Dummy images added:', createdImages);
    } catch (error) {
        console.error('Error populating images:', error);
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
                role: 'unverified',
            },
            {
                username: 'matt@gmail.com',
                firstName: 'Matt',
                lastName: 'Smith',
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
