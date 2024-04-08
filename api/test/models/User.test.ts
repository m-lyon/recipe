import mongoose from 'mongoose';
import { assert } from 'chai';
import { after, before, describe, it } from 'mocha';

import { MONGODB_URI } from '../../src/constants.js';
import { User } from '../../src/models/User.js';

describe('User Model', function () {
    before(function (done) {
        mongoose.connect(MONGODB_URI);
        mongoose.connection
            .once('open', () => done())
            .on('error', (error) => console.log('Error:', error));
    });

    after(function (done) {
        mongoose.connection.collections.users
            .drop()
            .then(() => mongoose.connection.close())
            .then(() => done());
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

    // Add more test cases as needed
});
