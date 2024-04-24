import { assert } from 'chai';
import mongoose from 'mongoose';
import { after, before, describe, it } from 'mocha';
import { MongoMemoryServer } from 'mongodb-memory-server-core';

import { User } from '../../src/models/User.js';

describe('User Model', function () {
    let mongoServer: MongoMemoryServer;

    before(async function () {
        try {
            mongoServer = await MongoMemoryServer.create();
            mongoose.set({ strictQuery: true });
            await mongoose.connect(mongoServer.getUri());
        } catch (error) {
            console.log(error);
            assert.fail('Connection not established');
        }
    });

    after(async function () {
        try {
            await mongoose.connection.close();
            await mongoServer.stop();
        } catch (error) {
            console.log(error);
            assert.fail('Connection not closed');
        }
    });

    it('Should save a new user', function (done) {
        const newUser = new User({
            firstName: 'Tester',
            lastName: 'McTestFace',
            role: 'user',
        });
        newUser
            .save()
            .then(() => {
                assert.isFalse(newUser.isNew);
                done();
            })
            .catch((error) => {
                console.log(error);
                assert.fail('User not saved');
            });
    });

    it('Should find user by username', function (done) {
        User.findOne({ firstName: 'Tester' }).then((user) => {
            if (user) {
                assert.strictEqual(user.firstName, 'Tester');
            } else {
                assert.fail('User not found');
            }
            done();
        });
    });
});
