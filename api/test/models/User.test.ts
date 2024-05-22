import { assert } from 'chai';
import { after, before, describe, it } from 'mocha';

import { User } from '../../src/models/User.js';
import { startServer, stopServer } from '../utils/mongodb.js';

describe('User Model', function () {
    before(startServer);
    after(stopServer);

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
