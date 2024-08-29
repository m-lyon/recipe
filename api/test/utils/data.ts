import { assert } from 'chai';

import { User } from '../../src/models/User.js';
import { Unit } from '../../src/models/Unit.js';

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
}
