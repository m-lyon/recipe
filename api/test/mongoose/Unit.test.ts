import mongoose from 'mongoose';
import { assert } from 'chai';
import { after, afterEach, before, beforeEach, describe, it } from 'mocha';

import { User } from '../../src/models/User.js';
import { Unit } from '../../src/models/Unit.js';
import { startServer, stopServer } from '../utils/mongodb.js';

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
        const newUnit = new Unit({
            shortSingular: 'test',
            shortPlural: 'tests',
            longSingular: 'test',
            longPlural: 'tests',
            preferredNumberFormat: 'decimal',
            owner: user._id,
            hasSpace: false,
        });
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
        const newUnit = new Unit({
            shortSingular: 'test',
            shortPlural: 'tests',
            longSingular: 'test',
            longPlural: 'tests',
            preferredNumberFormat: 'decimal',
            owner: admin._id,
            hasSpace: false,
        });

        try {
            await newUnit.save();
            assert.isFalse(newUnit.isNew);
        } catch (error) {
            console.log(error);
            assert.fail('Unit not saved');
        }

        const duplicateUnit = new Unit({
            shortSingular: 'test',
            shortPlural: 'tests',
            longSingular: 'test',
            longPlural: 'tests',
            preferredNumberFormat: 'decimal',
            owner: user._id,
            hasSpace: false,
        });

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
        const newUnit1 = new Unit({
            shortSingular: 'test',
            shortPlural: 'tests',
            longSingular: 'test',
            longPlural: 'tests',
            preferredNumberFormat: 'decimal',
            hasSpace: false,
            owner: admin._id,
        });
        const newUnit2 = new Unit({
            shortSingular: 'test2',
            shortPlural: 'tests2',
            longSingular: 'test2',
            longPlural: 'tests2',
            preferredNumberFormat: 'decimal',
            hasSpace: false,
            owner: admin._id,
        });

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
        const newUnit = new Unit({
            shortSingular: 'test',
            shortPlural: 'tests',
            longSingular: 'test',
            longPlural: 'tests',
            preferredNumberFormat: 'decimal',
            owner: admin1._id,
            hasSpace: false,
        });

        try {
            await newUnit.save();
            assert.isFalse(newUnit.isNew);
        } catch (error) {
            console.log(error);
            assert.fail('Unit not saved');
        }

        const duplicateUnit = new Unit({
            shortSingular: 'test',
            shortPlural: 'tests',
            longSingular: 'test',
            longPlural: 'tests',
            preferredNumberFormat: 'decimal',
            owner: admin2._id,
            hasSpace: false,
        });

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
        const newUnit1 = new Unit({
            shortSingular: 'test',
            shortPlural: 'tests',
            longSingular: 'test',
            longPlural: 'tests',
            preferredNumberFormat: 'decimal',
            owner: admin1._id,
            hasSpace: false,
        });
        const newUnit2 = new Unit({
            shortSingular: 'test2',
            shortPlural: 'tests2',
            longSingular: 'test2',
            longPlural: 'tests2',
            preferredNumberFormat: 'decimal',
            owner: admin2._id,
            hasSpace: false,
        });

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
        const newUnit = new Unit({
            shortSingular: 'test',
            shortPlural: 'tests',
            longSingular: 'test',
            longPlural: 'tests',
            preferredNumberFormat: 'decimal',
            owner: user._id,
            hasSpace: false,
        });

        try {
            await newUnit.save();
            assert.isFalse(newUnit.isNew);
        } catch (error) {
            console.log(error);
            assert.fail('Unit not saved');
        }

        const duplicateUnit = new Unit({
            shortSingular: 'test',
            shortPlural: 'tests',
            longSingular: 'test',
            longPlural: 'tests',
            preferredNumberFormat: 'decimal',
            owner: user._id,
            hasSpace: false,
        });

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
        const newUnit1 = new Unit({
            shortSingular: 'test',
            shortPlural: 'tests',
            longSingular: 'test',
            longPlural: 'tests',
            preferredNumberFormat: 'decimal',
            owner: user._id,
            hasSpace: false,
        });
        const newUnit2 = new Unit({
            shortSingular: 'test2',
            shortPlural: 'tests2',
            longSingular: 'test2',
            longPlural: 'tests2',
            preferredNumberFormat: 'decimal',
            owner: user._id,
            hasSpace: false,
        });

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
        const newUnit = new Unit({
            shortSingular: 'test',
            shortPlural: 'tests',
            longSingular: 'test',
            longPlural: 'tests',
            preferredNumberFormat: 'decimal',
            owner: user1._id,
            hasSpace: false,
        });

        try {
            await newUnit.save();
            assert.isFalse(newUnit.isNew);
        } catch (error) {
            console.log(error);
            assert.fail('Unit not saved');
        }

        const duplicateUnit = new Unit({
            shortSingular: 'test',
            shortPlural: 'tests',
            longSingular: 'test',
            longPlural: 'tests',
            preferredNumberFormat: 'decimal',
            owner: user2._id,
            hasSpace: false,
        });

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
        const newUnit1 = new Unit({
            shortSingular: 'test',
            shortPlural: 'tests',
            longSingular: 'test',
            longPlural: 'tests',
            preferredNumberFormat: 'decimal',
            owner: user1._id,
            hasSpace: false,
        });
        const newUnit2 = new Unit({
            shortSingular: 'test2',
            shortPlural: 'tests',
            longSingular: 'test',
            longPlural: 'tests',
            preferredNumberFormat: 'decimal',
            owner: user2._id,
            hasSpace: false,
        });

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
