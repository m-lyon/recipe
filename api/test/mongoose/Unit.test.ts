import { assert } from 'chai';
import mongoose from 'mongoose';
import { after, afterEach, before, beforeEach, describe, it } from 'mocha';

import { User } from '../../src/models/User.js';
import { Unit } from '../../src/models/Unit.js';
import { startServer, stopServer } from '../utils/mongodb.js';

const getMockUnitOne = (user) => {
    const UnitOne = {
        shortSingular: 'test',
        shortPlural: 'tests',
        longSingular: 'test',
        longPlural: 'tests',
        preferredNumberFormat: 'decimal',
        owner: user._id,
        hasSpace: false,
        unique: true,
    };
    return UnitOne;
};

const getMockUnitTwo = (user) => {
    const UnitTwo = {
        shortSingular: 'test2',
        shortPlural: 'tests2',
        longSingular: 'test2',
        longPlural: 'tests2',
        preferredNumberFormat: 'decimal',
        owner: user._id,
        hasSpace: false,
        unique: true,
    };
    return UnitTwo;
};

describe('Unit Model', function () {
    before(startServer);
    after(stopServer);

    beforeEach(function (done) {
        const user1 = new User({
            username: 'testuser1',
            firstName: 'Tester1',
            lastName: 'McTestFace',
            role: 'user',
        });
        const user2 = new User({
            username: 'testuser2',
            firstName: 'Tester2',
            lastName: 'McTestFace',
            role: 'user',
        });
        const admin1 = new User({
            username: 'adminuser1',
            firstName: 'Admin1',
            lastName: 'McAdminFace',
            role: 'admin',
        });
        const admin2 = new User({
            username: 'adminuser2',
            firstName: 'Admin2',
            lastName: 'McAdminFace',
            role: 'admin',
        });
        Promise.all([user1.save(), user2.save(), admin1.save(), admin2.save()])
            .then(() => done())
            .catch((error) => {
                console.log(error);
                assert.fail('Users not saved');
            });
    });

    afterEach(function (done) {
        mongoose.connection.collections.users
            .drop()
            .then(() => mongoose.connection.collections.units.drop())
            .then(() => done())
            .catch((error) => {
                console.log(error);
                assert.fail('Users not deleted');
            });
    });

    it('Should save a new unit', async function () {
        const user = await User.findOne({ firstName: 'Tester1' });
        const newUnit = new Unit(getMockUnitOne(user));
        try {
            await newUnit.save();
            assert.isFalse(newUnit.isNew);
        } catch (error) {
            console.log(error);
            assert.fail('Unit not saved');
        }
    });

    it('Should NOT save a unit with a duplicate short singular name admin1 to user1', async function () {
        const user = await User.findOne({ firstName: 'Tester1' });
        const admin = await User.findOne({ firstName: 'Admin1', role: 'admin' });
        const newUnit = new Unit(getMockUnitOne(admin));

        try {
            await newUnit.save();
            assert.isFalse(newUnit.isNew);
        } catch (error) {
            console.log(error);
            assert.fail('Unit not saved');
        }

        const duplicateUnit = new Unit(getMockUnitOne(user));

        try {
            await duplicateUnit.save();
            assert.fail('Duplicate unit saved');
        } catch (error) {
            assert.equal(
                error.errors.shortSingular.message,
                'The short singular unit name must be unique.'
            );
        }
    });

    it('Should NOT update a unit with a duplicate short singular name admin1 to user1', async function () {
        const admin = await User.findOne({ firstName: 'Admin1', role: 'admin' });
        const newUnit1 = new Unit(getMockUnitOne(admin));
        const newUnit2 = new Unit(getMockUnitTwo(admin));

        try {
            await newUnit1.save();
            await newUnit2.save();
            assert.isFalse(newUnit1.isNew);
            assert.isFalse(newUnit2.isNew);
        } catch (error) {
            console.log(error);
            assert.fail('Units not saved');
        }

        newUnit2.shortSingular = 'test';
        try {
            await newUnit2.save();
            assert.fail('Duplicate unit saved');
        } catch (error) {
            assert.equal(
                error.errors.shortSingular.message,
                'The short singular unit name must be unique.'
            );
        }
    });

    it('Should NOT save a unit with a duplicate short singular name admin1 to admin2', async function () {
        const admin1 = await User.findOne({ firstName: 'Admin1', role: 'admin' });
        const admin2 = await User.findOne({ firstName: 'Admin2', role: 'admin' });
        const newUnit = new Unit(getMockUnitOne(admin1));

        try {
            await newUnit.save();
            assert.isFalse(newUnit.isNew);
        } catch (error) {
            console.log(error);
            assert.fail('Unit not saved');
        }

        const duplicateUnit = new Unit(getMockUnitOne(admin2));

        try {
            await duplicateUnit.save();
            assert.fail('Duplicate unit saved');
        } catch (error) {
            assert.equal(
                error.errors.shortSingular.message,
                'The short singular unit name must be unique.'
            );
        }
    });

    it('Should NOT update a unit with a duplicate short singular name admin1 to admin2', async function () {
        const admin1 = await User.findOne({ firstName: 'Admin1', role: 'admin' });
        const admin2 = await User.findOne({ firstName: 'Admin2', role: 'admin' });
        const newUnit1 = new Unit(getMockUnitOne(admin1));
        const newUnit2 = new Unit(getMockUnitTwo(admin2));

        try {
            await newUnit1.save();
            await newUnit2.save();
            assert.isFalse(newUnit1.isNew);
            assert.isFalse(newUnit2.isNew);
        } catch (error) {
            console.log(error);
            assert.fail('Units not saved');
        }

        newUnit2.shortSingular = 'test';
        try {
            await newUnit2.save();
            assert.fail('Duplicate unit saved');
        } catch (error) {
            assert.equal(
                error.errors.shortSingular.message,
                'The short singular unit name must be unique.'
            );
        }
    });

    it('Should NOT save a unit with a duplicate short singular name user1 to user1', async function () {
        const user = await User.findOne({ firstName: 'Tester1' });
        const newUnit = new Unit(getMockUnitOne(user));

        try {
            await newUnit.save();
            assert.isFalse(newUnit.isNew);
        } catch (error) {
            console.log(error);
            assert.fail('Unit not saved');
        }

        const duplicateUnit = new Unit(getMockUnitOne(user));

        try {
            await duplicateUnit.save();
            assert.fail('Duplicate unit saved');
        } catch (error) {
            assert.equal(
                error.errors.shortSingular.message,
                'The short singular unit name must be unique.'
            );
        }
    });

    it('Should NOT update a unit with a duplicate short singular name user1 to user2', async function () {
        const user = await User.findOne({ firstName: 'Tester1' });
        const newUnit1 = new Unit(getMockUnitOne(user));
        const newUnit2 = new Unit(getMockUnitTwo(user));

        try {
            await newUnit1.save();
            await newUnit2.save();
            assert.isFalse(newUnit1.isNew);
            assert.isFalse(newUnit2.isNew);
        } catch (error) {
            console.log(error);
            assert.fail('Units not saved');
        }

        newUnit2.shortSingular = 'test';
        try {
            await newUnit2.save();
            assert.fail('Duplicate unit saved');
        } catch (error) {
            assert.equal(
                error.errors.shortSingular.message,
                'The short singular unit name must be unique.'
            );
        }
    });

    it('Should save a unit with a duplicate short singular name user1 to user2', async function () {
        const user1 = await User.findOne({ firstName: 'Tester1' });
        const user2 = await User.findOne({ firstName: 'Tester2' });
        const newUnit = new Unit(getMockUnitOne(user1));

        try {
            await newUnit.save();
            assert.isFalse(newUnit.isNew);
        } catch (error) {
            console.log(error);
            assert.fail('Unit not saved');
        }
        const duplicateUnit = new Unit(getMockUnitOne(user2));

        try {
            await duplicateUnit.save();
            assert.isFalse(duplicateUnit.isNew);
        } catch (error) {
            assert.fail('Duplicate unit not saved');
        }
    });

    it('Should update a unit with a duplicate short singular name user1 to user2', async function () {
        const user1 = await User.findOne({ firstName: 'Tester1' });
        const user2 = await User.findOne({ firstName: 'Tester2' });
        const newUnit1 = new Unit(getMockUnitOne(user1));
        const newUnit2 = new Unit({ ...getMockUnitOne(user2), shortSingular: 'test2' });

        try {
            await newUnit1.save();
            await newUnit2.save();
            assert.isFalse(newUnit1.isNew);
            assert.isFalse(newUnit2.isNew);
        } catch (error) {
            console.log(error);
            assert.fail('Units not saved');
        }

        newUnit2.shortSingular = 'test';
        try {
            await newUnit2.save();
            assert.isFalse(newUnit2.isNew);
        } catch (error) {
            console.log(error);
            assert.fail('Duplicate unit not saved');
        }
    });
});
