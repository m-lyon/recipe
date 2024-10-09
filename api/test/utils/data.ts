import { assert } from 'chai';

import { Tag } from '../../src/models/Tag.js';
import { User } from '../../src/models/User.js';
import { Unit } from '../../src/models/Unit.js';
import { Size } from '../../src/models/Size.js';
import { Recipe } from '../../src/models/Recipe.js';
import { Ingredient } from '../../src/models/Ingredient.js';
import { PrepMethod } from '../../src/models/PrepMethod.js';

export async function createUser() {
    const user = await User.register(
        new User({
            username: 'testuser1',
            firstName: 'Tester1',
            lastName: 'McTestFace',
            role: 'user',
        }),
        'password'
    );
    assert(user);
    return user;
}

export async function createAdmin() {
    const user = await User.register(
        new User({
            username: 'testuser2',
            firstName: 'Tester2',
            lastName: 'McTestFace',
            role: 'admin',
        }),
        'password'
    );
    assert(user);
    return user;
}

export async function createRecipeTags() {
    const tag1 = await new Tag({
        value: 'dinner',
    }).save();
    assert(tag1);
    const tag2 = await new Tag({
        value: 'lunch',
    }).save();
    assert(tag2);
}

export async function createUnits(user: User) {
    const unit1 = await new Unit({
        shortSingular: 'tsp',
        shortPlural: 'tsp',
        longSingular: 'teaspoon',
        longPlural: 'teaspoons',
        preferredNumberFormat: 'fraction',
        owner: user._id,
        hasSpace: true,
        unique: true,
    }).save();
    assert(unit1);
    const unit2 = await new Unit({
        shortSingular: 'tbsp',
        shortPlural: 'tbsp',
        longSingular: 'tablespoon',
        longPlural: 'tablespoons',
        preferredNumberFormat: 'fraction',
        owner: user._id,
        hasSpace: true,
        unique: true,
    }).save();
    assert(unit2);
    const unit3 = await new Unit({
        shortSingular: 'cup',
        shortPlural: 'cups',
        longSingular: 'cup',
        longPlural: 'cups',
        preferredNumberFormat: 'fraction',
        owner: user._id,
        hasSpace: true,
        unique: true,
    }).save();
    assert(unit3);
    const unit4 = await new Unit({
        shortSingular: 'g',
        shortPlural: 'g',
        longSingular: 'gram',
        longPlural: 'grams',
        preferredNumberFormat: 'decimal',
        owner: user._id,
        hasSpace: false,
        unique: true,
    }).save();
    assert(unit4);
}

export async function createSizes(user: User) {
    const size1 = await new Size({
        value: 'small',
        unique: true,
        owner: user._id,
    }).save();
    assert(size1);
    const size2 = await new Size({
        value: 'medium',
        unique: true,
        owner: user._id,
    }).save();
    assert(size2);
    const size3 = await new Size({
        value: 'large',
        unique: true,
        owner: user._id,
    }).save();
    assert(size3);
}

export async function createIngredients(user: User) {
    const ingredient1 = await new Ingredient({
        name: 'chicken',
        pluralName: 'chickens',
        isCountable: true,
        owner: user._id,
        tags: [],
    }).save();
    assert(ingredient1);
    const ingredient2 = await new Ingredient({
        name: 'tomato',
        pluralName: 'tomatoes',
        isCountable: true,
        owner: user._id,
        tags: ['vegan', 'vegetarian'],
    }).save();
    assert(ingredient2);
    const ingredient3 = await new Ingredient({
        name: 'salt',
        pluralName: 'salt',
        isCountable: false,
        owner: user._id,
        tags: ['vegan', 'vegetarian'],
    }).save();
    assert(ingredient3);
}

export async function createRecipesAsIngredients(user: User) {
    const chicken = await Ingredient.findOne({ name: 'chicken' });
    const cup = await Unit.findOne({ shortSingular: 'cup' });
    const chopped = await PrepMethod.findOne({ value: 'chopped' });
    const recipe = await new Recipe({
        title: 'Bimibap',
        titleIdentifier: 'bimibap',
        pluralTitle: 'Bimibaps',
        ingredientSubsections: [
            {
                ingredients: [
                    {
                        ingredient: chicken._id,
                        quantity: '3',
                        unit: cup._id,
                        prepMethod: chopped._id,
                    },
                ],
            },
        ],
        instructionSubsections: [
            {
                name: 'Main',
                instructions: ['Cook the bimibap.'],
            },
        ],
        numServings: 2,
        tags: [],
        isIngredient: true,
        owner: user._id,
        createdAt: new Date(),
        lastModified: new Date(),
    }).save();
    assert(recipe);
}

export async function createPrepMethods(user: User) {
    const prepMethod1 = await new PrepMethod({
        value: 'chopped',
        unique: true,
        owner: user._id,
    }).save();
    assert(prepMethod1);
    const prepMethod2 = await new PrepMethod({
        value: 'diced',
        unique: true,
        owner: user._id,
    }).save();
    assert(prepMethod2);
}
