import { assert } from 'chai';
import mongoose from 'mongoose';
import { after, afterEach, before, beforeEach, describe, it } from 'mocha';

import { User } from '../../src/models/User.js';
import { Unit } from '../../src/models/Unit.js';
import { startServer, stopServer } from '../utils/mongodb.js';
import { ConversionRule, UnitConversion } from '../../src/models/UnitConversion.js';

async function createData() {
    const user = await User.register(
        new User({
            username: 'testuser1',
            firstName: 'Tester1',
            lastName: 'McTestFace',
            role: 'admin',
        }),
        'password'
    );
    assert(user);
    const unit1 = await new Unit({
        shortSingular: 'tsp',
        shortPlural: 'tsp',
        longSingular: 'teaspoon',
        longPlural: 'teaspoons',
        preferredNumberFormat: 'fraction',
        owner: user._id,
        hasSpace: true,
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
    }).save();
    assert(unit3);
}

function removeData(done) {
    mongoose.connection.collections.users
        .drop()
        .then(() => mongoose.connection.collections.units.drop())
        .then(() => {
            if (mongoose.connection.collections.conversionrules) {
                mongoose.connection.collections.conversionrules.drop();
            }
        })
        .then(() => {
            if (mongoose.connection.collections.unitconversions) {
                mongoose.connection.collections.unitconversions.drop();
            }
        })
        .then(() => done())
        .catch((error) => {
            console.log(error);
            assert.fail('Data not deleted');
        });
}

async function createConversionRule(context, user, record) {
    const query = `
    mutation ConversionRuleCreateOne($record: CreateOneConversionRuleInput!) {
        conversionRuleCreateOne(record: $record) {
            record {
                _id
                unit {
                    _id
                }
                baseUnit {
                    _id
                }
                baseToUnitConversion
                baseUnitThreshold
            }
        }
    }`;
    const response = await context.apolloServer.executeOperation(
        {
            query: query,
            variables: { record },
        },
        {
            contextValue: {
                isAuthenticated: () => true,
                getUser: () => user,
            },
        }
    );
    return response;
}

const parseCreatedConversionRule = (response) => {
    assert(response.body.kind === 'single');
    assert.isUndefined(response.body.singleResult.errors);
    const record = (
        response.body.singleResult.data as {
            conversionRuleCreateOne: {
                record: {
                    _id: string;
                    unit: { _id: string };
                    baseUnit: { _id: string };
                    baseToUnitConversion: number;
                    baseUnitThreshold: number;
                };
            };
        }
    ).conversionRuleCreateOne.record;
    return record;
};

describe('conversionRuleCreateOne', () => {
    before(startServer);
    after(stopServer);
    beforeEach(createData);
    afterEach(removeData);

    it('should create a conversion rule', async function () {
        const user = await User.findOne({ username: 'testuser1' });
        const baseUnit = await Unit.findOne({ shortSingular: 'tsp' });
        const unit = await Unit.findOne({ shortSingular: 'tbsp' });
        const record = {
            unit: unit._id,
            baseUnit: baseUnit._id,
            baseToUnitConversion: 3,
            baseUnitThreshold: 1,
        };
        const response = await createConversionRule(this, user, record);
        const createdConversionRule = parseCreatedConversionRule(response);
        assert.equal(createdConversionRule.unit._id, unit._id);
    });

    it('should not create a conversion rule if the unit already has a conversion rule', async function () {
        const user = await User.findOne({ username: 'testuser1' });
        const baseUnit = await Unit.findOne({ shortSingular: 'tsp' });
        const unit = await Unit.findOne({ shortSingular: 'tbsp' });
        const record = {
            unit: unit._id,
            baseUnit: baseUnit._id,
            baseToUnitConversion: 3,
            baseUnitThreshold: 1,
        };
        await createConversionRule(this, user, record);
        const response = await createConversionRule(this, user, record);
        assert(response.body.kind === 'single');
        assert.isDefined(response.body.singleResult.errors);
        assert.equal(
            response.body.singleResult.errors[0].message,
            'ConversionRule validation failed: unit: Unit already has conversion rule.'
        );
    });

    it('should not create a conversion rule if the unit does not exist', async function () {
        const user = await User.findOne({ username: 'testuser1' });
        const baseUnit = await Unit.findOne({ shortSingular: 'tsp' });
        const record = {
            unit: '60a9c5d4d3f6c1c1e8a3c1c1',
            baseUnit: baseUnit._id,
            baseToUnitConversion: 3,
            baseUnitThreshold: 1,
        };
        const response = await createConversionRule(this, user, record);
        assert(response.body.kind === 'single');
        assert.isDefined(response.body.singleResult.errors);
        assert.equal(
            response.body.singleResult.errors[0].message,
            'ConversionRule validation failed: unit: The unit must be valid.'
        );
    });

    it('should not create a conversion rule if the baseUnitThreshold is less than or equal to 0', async function () {
        const user = await User.findOne({ username: 'testuser1' });
        const baseUnit = await Unit.findOne({ shortSingular: 'tsp' });
        const unit = await Unit.findOne({ shortSingular: 'tbsp' });
        const record = {
            unit: unit._id,
            baseUnit: baseUnit._id,
            baseToUnitConversion: 3,
            baseUnitThreshold: 0,
        };
        const response = await createConversionRule(this, user, record);
        assert(response.body.kind === 'single');
        assert.isDefined(response.body.singleResult.errors);
        assert.equal(
            response.body.singleResult.errors[0].message,
            'ConversionRule validation failed: baseUnitThreshold: Threshold must be greater than 0.'
        );
    });
    it('should not create a conversion rule if the baseUnit does not exist', async function () {
        const user = await User.findOne({ username: 'testuser1' });
        const unit = await Unit.findOne({ shortSingular: 'tbsp' });
        const record = {
            unit: unit._id,
            baseUnit: '60a9c5d4d3f6c1c1e8a3c1c1',
            baseToUnitConversion: 3,
            baseUnitThreshold: 1,
        };
        const response = await createConversionRule(this, user, record);
        assert(response.body.kind === 'single');
        assert.isDefined(response.body.singleResult.errors);
        assert.equal(
            response.body.singleResult.errors[0].message,
            'ConversionRule validation failed: baseUnit: The unit must be valid.'
        );
    });

    it('should not create a conversion rule if the baseToUnitConversion is less than 1', async function () {
        const user = await User.findOne({ username: 'testuser1' });
        const baseUnit = await Unit.findOne({ shortSingular: 'tsp' });
        const unit = await Unit.findOne({ shortSingular: 'tbsp' });
        const record = {
            unit: unit._id,
            baseUnit: baseUnit._id,
            baseToUnitConversion: 0.9,
            baseUnitThreshold: 1,
        };
        const response = await createConversionRule(this, user, record);
        assert(response.body.kind === 'single');
        assert.isDefined(response.body.singleResult.errors);
        assert.equal(
            response.body.singleResult.errors[0].message,
            'ConversionRule validation failed: baseToUnitConversion: Base to unit conversion must be greater than 1.'
        );
    });
});

describe('conversionRuleUpdateById', () => {
    before(startServer);
    after(stopServer);
    beforeEach(createData);
    afterEach(removeData);

    async function updateConversionRule(context, user, id, record) {
        const query = `
        mutation ConversionRuleUpdateById($id: MongoID!, $record: UpdateByIdConversionRuleInput!) {
            conversionRuleUpdateById(_id: $id, record: $record) {
                record {
                    _id
                    unit {
                        _id
                    }
                    baseUnit {
                        _id
                    }
                    baseToUnitConversion
                    baseUnitThreshold
                }
            }
        }`;
        const response = await context.apolloServer.executeOperation(
            {
                query: query,
                variables: { id, record },
            },
            {
                contextValue: {
                    isAuthenticated: () => true,
                    getUser: () => user,
                },
            }
        );
        return response;
    }

    it('should update a conversion rule', async function () {
        const user = await User.findOne({ username: 'testuser1' });
        const baseUnit = await Unit.findOne({ shortSingular: 'tsp' });
        const unit = await Unit.findOne({ shortSingular: 'tbsp' });
        const record = {
            unit: unit._id,
            baseUnit: baseUnit._id,
            baseToUnitConversion: 3,
            baseUnitThreshold: 1,
        };
        const response = await createConversionRule(this, user, record);
        const createdConversionRule = parseCreatedConversionRule(response);
        const update = {
            unit: unit._id,
            baseUnit: baseUnit._id,
            baseToUnitConversion: 4,
            baseUnitThreshold: 2,
        };
        const updateResponse = await updateConversionRule(
            this,
            user,
            createdConversionRule._id,
            update
        );
        assert(updateResponse.body.kind === 'single');
        assert.isUndefined(updateResponse.body.singleResult.errors);
        const updatedConversionRule = (
            updateResponse.body.singleResult.data as {
                conversionRuleUpdateById: {
                    record: {
                        _id: string;
                        unit: { _id: string };
                        baseUnit: { _id: string };
                        baseToUnitConversion: number;
                        baseUnitThreshold: number;
                    };
                };
            }
        ).conversionRuleUpdateById.record;
        assert.equal(updatedConversionRule.baseToUnitConversion, 4);
    });

    it('should not update a conversion rule if the unit does not exist', async function () {
        const user = await User.findOne({ username: 'testuser1' });
        const baseUnit = await Unit.findOne({ shortSingular: 'tsp' });
        const unit = await Unit.findOne({ shortSingular: 'tbsp' });
        const record = {
            unit: unit._id,
            baseUnit: baseUnit._id,
            baseToUnitConversion: 3,
            baseUnitThreshold: 1,
        };
        const response = await createConversionRule(this, user, record);
        const createdConversionRule = parseCreatedConversionRule(response);
        const update = {
            unit: '60a9c5d4d3f6c1c1e8a3c1c1',
        };
        const updateResponse = await updateConversionRule(
            this,
            user,
            createdConversionRule._id,
            update
        );
        assert(updateResponse.body.kind === 'single');
        assert.isDefined(updateResponse.body.singleResult.errors);
        assert.equal(
            updateResponse.body.singleResult.errors[0].message,
            'ConversionRule validation failed: unit: The unit must be valid.'
        );
    });

    it('should not update a conversion rule if the baseUnitThreshold is less than or equal to 0', async function () {
        const user = await User.findOne({ username: 'testuser1' });
        const baseUnit = await Unit.findOne({ shortSingular: 'tsp' });
        const unit = await Unit.findOne({ shortSingular: 'tbsp' });
        const record = {
            unit: unit._id,
            baseUnit: baseUnit._id,
            baseToUnitConversion: 3,
            baseUnitThreshold: 1,
        };
        const response = await createConversionRule(this, user, record);
        const createdConversionRule = parseCreatedConversionRule(response);
        const update = {
            baseUnitThreshold: 0,
        };
        const updateResponse = await updateConversionRule(
            this,
            user,
            createdConversionRule._id,
            update
        );
        assert(updateResponse.body.kind === 'single');
        assert.isDefined(updateResponse.body.singleResult.errors);
        assert.equal(
            updateResponse.body.singleResult.errors[0].message,
            'ConversionRule validation failed: baseUnitThreshold: Threshold must be greater than 0.'
        );
    });

    it('should not update a conversion rule if the baseUnit does not exist', async function () {
        const user = await User.findOne({ username: 'testuser1' });
        const unit = await Unit.findOne({ shortSingular: 'tbsp' });
        const baseUnit = await Unit.findOne({ shortSingular: 'tsp' });
        const record = {
            unit: unit._id,
            baseUnit: baseUnit._id,
            baseToUnitConversion: 3,
            baseUnitThreshold: 1,
        };
        const response = await createConversionRule(this, user, record);
        const createdConversionRule = parseCreatedConversionRule(response);
        const update = {
            baseUnit: '60a9c5d4d3f6c1c1e8a3c1c1',
        };
        const updateResponse = await updateConversionRule(
            this,
            user,
            createdConversionRule._id,
            update
        );
        assert(updateResponse.body.kind === 'single');
        assert.isDefined(updateResponse.body.singleResult.errors);
        assert.equal(
            updateResponse.body.singleResult.errors[0].message,
            'ConversionRule validation failed: baseUnit: The unit must be valid.'
        );
    });

    it('should not update a conversion rule if the baseToUnitConversion is less than 1', async function () {
        const user = await User.findOne({ username: 'testuser1' });
        const baseUnit = await Unit.findOne({ shortSingular: 'tsp' });
        const unit = await Unit.findOne({ shortSingular: 'tbsp' });
        const record = {
            unit: unit._id,
            baseUnit: baseUnit._id,
            baseToUnitConversion: 3,
            baseUnitThreshold: 1,
        };
        const response = await createConversionRule(this, user, record);
        const createdConversionRule = parseCreatedConversionRule(response);
        const update = {
            baseToUnitConversion: 0.7,
        };
        const updateResponse = await updateConversionRule(
            this,
            user,
            createdConversionRule._id,
            update
        );
        assert(updateResponse.body.kind === 'single');
        assert.isDefined(updateResponse.body.singleResult.errors);
        assert.equal(
            updateResponse.body.singleResult.errors[0].message,
            'ConversionRule validation failed: baseToUnitConversion: Base to unit conversion must be greater than 1.'
        );
    });

    it('should not update a conversion rule if the conversion rule does not exist', async function () {
        const user = await User.findOne({ username: 'testuser1' });
        const baseUnit = await Unit.findOne({ shortSingular: 'tsp' });
        const unit = await Unit.findOne({ shortSingular: 'tbsp' });
        const record = {
            unit: unit._id,
            baseUnit: baseUnit._id,
            baseToUnitConversion: 3,
            baseUnitThreshold: 1,
        };
        await createConversionRule(this, user, record);
        const update = {
            baseToUnitConversion: 4,
            baseUnitThreshold: 2,
        };
        const updateResponse = await updateConversionRule(
            this,
            user,
            '60a9c5d4d3f6c1c1e8a3c1c1',
            update
        );
        assert(updateResponse.body.kind === 'single');
        assert.isDefined(updateResponse.body.singleResult.errors);
        assert.equal(updateResponse.body.singleResult.errors[0].message, 'Document not found');
    });

    it('should not update a conversion rule if the unit already has a conversion rule', async function () {
        const user = await User.findOne({ username: 'testuser1' });
        const baseUnit = await Unit.findOne({ shortSingular: 'tsp' });
        const unit = await Unit.findOne({ shortSingular: 'tbsp' });
        const record = {
            unit: unit._id,
            baseUnit: baseUnit._id,
            baseToUnitConversion: 3,
            baseUnitThreshold: 1,
        };
        const response = await createConversionRule(this, user, record);
        const createdConversionRule = parseCreatedConversionRule(response);
        const unit2 = await Unit.findOne({ shortSingular: 'cup' });
        const record2 = {
            unit: unit2._id,
            baseUnit: baseUnit._id,
            baseToUnitConversion: 3,
            baseUnitThreshold: 1,
        };
        await createConversionRule(this, user, record2);
        const update = { unit: unit2._id };
        const updateResponse = await updateConversionRule(
            this,
            user,
            createdConversionRule._id,
            update
        );
        assert(updateResponse.body.kind === 'single');
        assert.isDefined(updateResponse.body.singleResult.errors);
        assert.equal(
            updateResponse.body.singleResult.errors[0].message,
            'ConversionRule validation failed: unit: Unit already has conversion rule.'
        );
    });
});

async function createConversionRuleData() {
    const baseUnit = await Unit.findOne({ shortSingular: 'tsp' });
    const unit1 = await Unit.findOne({ shortSingular: 'tbsp' });
    const record1 = await new ConversionRule({
        unit: unit1._id,
        baseUnit: baseUnit._id,
        baseToUnitConversion: 3,
        baseUnitThreshold: 3,
    }).save();
    assert(record1);
    const unit2 = await Unit.findOne({ shortSingular: 'cup' });
    const record2 = await new ConversionRule({
        unit: unit2._id,
        baseUnit: baseUnit._id,
        baseToUnitConversion: 48,
        baseUnitThreshold: 48 / 4,
    }).save();
    assert(record2);
    const record3 = await new ConversionRule({
        unit: baseUnit._id,
        baseUnit: baseUnit._id,
        baseToUnitConversion: 1,
        baseUnitThreshold: 1,
    }).save();
    assert(record3);
}

async function createUnitConversion(context, user, record) {
    const query = `
    mutation UnitConversionCreateOne($record: CreateOneUnitConversionInput!) {
        unitConversionCreateOne(record: $record) {
            record {
                _id
                baseUnit {
                    _id
                }
                rules(sort: THRESHOLD_DESC) {
                    _id
                }
            }
        }
    }`;
    const response = await context.apolloServer.executeOperation(
        {
            query: query,
            variables: { record },
        },
        {
            contextValue: {
                isAuthenticated: () => true,
                getUser: () => user,
            },
        }
    );
    return response;
}

async function findUnitConversions(context, user, filter) {
    const query = `
    query UnitConversionMany($filter: FilterFindManyUnitConversionInput) {
        unitConversionMany(filter: $filter) {
            _id
            baseUnit {
                _id
            }
            rules(sort: THRESHOLD_DESC) {
                _id
            }
        }
    }`;
    const response = await context.apolloServer.executeOperation(
        {
            query: query,
            variables: { filter },
        },
        {
            contextValue: {
                isAuthenticated: () => true,
                getUser: () => user,
            },
        }
    );
    assert(response.body.kind === 'single');
    assert.isUndefined(response.body.singleResult.errors);
    return (
        response.body.singleResult.data as {
            unitConversionMany: {
                _id: string;
                baseUnit: { _id: string };
                rules: { _id: string }[];
            }[];
        }
    ).unitConversionMany;
}

describe('unitConversionFindMany', () => {
    before(startServer);
    after(stopServer);
    beforeEach(async function () {
        await createData();
        await createConversionRuleData();
        const rule1 = await ConversionRule.findOne({ baseUnitThreshold: 3 });
        const rule2 = await ConversionRule.findOne({ baseUnitThreshold: 48 / 4 });
        const rule3 = await ConversionRule.findOne({ baseUnitThreshold: 1 });
        const unitConversion = await new UnitConversion({
            baseUnit: rule3.baseUnit,
            rules: [rule1._id, rule2._id, rule3._id],
        }).save();
        assert(unitConversion);
    });
    afterEach(removeData);

    it('should find all unit conversions', async function () {
        const user = await User.findOne({ username: 'testuser1' });
        const unitConversions = await findUnitConversions(this, user, {});
        assert.equal(unitConversions.length, 1);
    });

    it('should find all unit conversions sorted by baseUnitThreshold', async function () {
        const user = await User.findOne({ username: 'testuser1' });
        const rule1 = await ConversionRule.findOne({ baseUnitThreshold: 3 });
        const rule2 = await ConversionRule.findOne({ baseUnitThreshold: 48 / 4 });
        const rule3 = await ConversionRule.findOne({ baseUnitThreshold: 1 });
        const unitConversions = await findUnitConversions(this, user, {});
        assert.equal(unitConversions[0].rules.length, 3);
        assert.equal(unitConversions[0].rules[0]._id, rule2._id, 'rule2 is not first');
        assert.equal(unitConversions[0].rules[1]._id, rule1._id, 'rule1 is not second');
        assert.equal(unitConversions[0].rules[2]._id, rule3._id, 'rule3 is not third');
    });
});

describe('unitConversionCreateOne', () => {
    before(startServer);
    after(stopServer);
    beforeEach(async function () {
        await createData();
        await createConversionRuleData();
    });
    afterEach(removeData);

    const parseCreatedUnitConversion = (response) => {
        assert(response.body.kind === 'single');
        assert.isUndefined(response.body.singleResult.errors);
        const record = (
            response.body.singleResult.data as {
                unitConversionCreateOne: {
                    record: {
                        _id: string;
                        baseUnit: { _id: string };
                        rules: { _id: string }[];
                    };
                };
            }
        ).unitConversionCreateOne.record;
        return record;
    };

    it('should create a unit conversion', async function () {
        const user = await User.findOne({ username: 'testuser1' });
        const baseUnit = await Unit.findOne({ shortSingular: 'tsp' });
        const unit1 = await Unit.findOne({ shortSingular: 'tbsp' });
        const unit2 = await Unit.findOne({ shortSingular: 'cup' });
        const rule1 = await ConversionRule.findOne({ unit: unit1._id });
        const rule2 = await ConversionRule.findOne({ unit: unit2._id });
        const record = { baseUnit: baseUnit._id, rules: [rule1._id, rule2._id] };
        const response = await createUnitConversion(this, user, record);
        const createdUnitConversion = parseCreatedUnitConversion(response);
        assert.equal(createdUnitConversion.baseUnit._id, baseUnit._id);
    });

    it('should create a unit conversion where the base unit is the same as one of the rules', async function () {
        const user = await User.findOne({ username: 'testuser1' });
        const baseUnit = await Unit.findOne({ shortSingular: 'tsp' });
        const unit1 = await Unit.findOne({ shortSingular: 'tbsp' });
        const rule1 = await ConversionRule.findOne({ unit: unit1._id });
        const rule2 = await ConversionRule.findOne({ unit: baseUnit._id });
        const record = { baseUnit: unit1._id, rules: [rule1._id, rule2._id] };
        const response = await createUnitConversion(this, user, record);
        const createdUnitConversion = parseCreatedUnitConversion(response);
        assert.equal(createdUnitConversion.baseUnit._id, unit1._id);
    });

    it('should create a unit, and the rules should be sorted by baseUnitThreshold', async function () {
        const user = await User.findOne({ username: 'testuser1' });
        const baseUnit = await Unit.findOne({ shortSingular: 'tsp' });
        const unit1 = await Unit.findOne({ shortSingular: 'tbsp' });
        const unit2 = await Unit.findOne({ shortSingular: 'cup' });
        const rule1 = await ConversionRule.findOne({ unit: unit1._id });
        const rule2 = await ConversionRule.findOne({ unit: unit2._id });
        rule1.baseUnitThreshold = 2;
        rule2.baseUnitThreshold = 4;
        await rule1.save();
        await rule2.save();
        const record = { baseUnit: baseUnit._id, rules: [rule1._id, rule2._id] };
        const response = await createUnitConversion(this, user, record);
        const createdUnitConversion = parseCreatedUnitConversion(response);
        assert.equal(createdUnitConversion.rules.length, 2);
        assert.equal(createdUnitConversion.rules[0]._id, rule2._id);
        assert.equal(createdUnitConversion.rules[1]._id, rule1._id);
    });

    it('should not create a unit conversion if no rules are given', async function () {
        const user = await User.findOne({ username: 'testuser1' });
        const baseUnit = await Unit.findOne({ shortSingular: 'tsp' });
        const record = { baseUnit: baseUnit._id, rules: [] };
        const response = await createUnitConversion(this, user, record);
        assert(response.body.kind === 'single');
        assert.isDefined(response.body.singleResult.errors);
        assert.equal(
            response.body.singleResult.errors[0].message,
            'UnitConversion validation failed: rules: At least one rule is required.'
        );
    });

    it('should not create a unit conversion if the rules have duplicate baseUnitThresholds', async function () {
        const user = await User.findOne({ username: 'testuser1' });
        const baseUnit = await Unit.findOne({ shortSingular: 'tsp' });
        const unit1 = await Unit.findOne({ shortSingular: 'tbsp' });
        const rule1 = await ConversionRule.findOne({ unit: unit1._id });
        const rule2 = await ConversionRule.findOne({ unit: baseUnit._id });
        rule2.baseUnitThreshold = rule1.baseUnitThreshold;
        await rule2.save();
        const record = { baseUnit: baseUnit._id, rules: [rule1._id, rule2._id] };
        const response = await createUnitConversion(this, user, record);
        assert(response.body.kind === 'single');
        assert.isDefined(response.body.singleResult.errors);
        assert.equal(
            response.body.singleResult.errors[0].message,
            'UnitConversion validation failed: rules: Duplicate thresholds are not allowed.'
        );
    });

    it('should not create a unit conversion if the rules have different base units', async function () {
        const user = await User.findOne({ username: 'testuser1' });
        const baseUnit = await Unit.findOne({ shortSingular: 'tsp' });
        const unit1 = await Unit.findOne({ shortSingular: 'tbsp' });
        const unit2 = await Unit.findOne({ shortSingular: 'cup' });
        const rule1 = await ConversionRule.findOne({ unit: unit1._id });
        const rule2 = await ConversionRule.findOne({ unit: unit2._id });
        rule2.baseUnit = unit1._id;
        await rule2.save();
        const record = { baseUnit: baseUnit._id, rules: [rule1._id, rule2._id] };
        const response = await createUnitConversion(this, user, record);
        assert(response.body.kind === 'single');
        assert.isDefined(response.body.singleResult.errors);
        assert.equal(
            response.body.singleResult.errors[0].message,
            'UnitConversion validation failed: rules: All base units in rules must be the same.'
        );
    });
});

describe('unitConversionUpdateById', () => {
    before(startServer);
    after(stopServer);
    beforeEach(async function () {
        await createData();
        await createConversionRuleData();
    });
    afterEach(removeData);

    async function updateUnitConversion(context, user, id, record) {
        const query = `
        mutation UnitConversionUpdateById($id: MongoID!, $record: UpdateByIdUnitConversionInput!) {
            unitConversionUpdateById(_id: $id, record: $record) {
                record {
                    _id
                    baseUnit {
                        _id
                    }
                    rules(sort: THRESHOLD_DESC) {
                        _id
                    }
                }
            }
        }`;
        const response = await context.apolloServer.executeOperation(
            {
                query: query,
                variables: { id, record },
            },
            {
                contextValue: {
                    isAuthenticated: () => true,
                    getUser: () => user,
                },
            }
        );
        return response;
    }

    function parseCreatedUnitConversion(response) {
        assert(response.body.kind === 'single');
        assert.isUndefined(response.body.singleResult.errors);
        const record = (
            response.body.singleResult.data as {
                unitConversionCreateOne: {
                    record: {
                        _id: string;
                        baseUnit: { _id: string };
                        rules: { _id: string }[];
                    };
                };
            }
        ).unitConversionCreateOne.record;
        return record;
    }

    function parseUpdatedUnitConversion(response) {
        assert(response.body.kind === 'single');
        assert.isUndefined(response.body.singleResult.errors);
        const record = (
            response.body.singleResult.data as {
                unitConversionUpdateById: {
                    record: {
                        _id: string;
                        baseUnit: { _id: string };
                        rules: { _id: string }[];
                    };
                };
            }
        ).unitConversionUpdateById.record;
        return record;
    }

    it('should update a unit conversion', async function () {
        const user = await User.findOne({ username: 'testuser1' });
        const baseUnit = await Unit.findOne({ shortSingular: 'tsp' });
        const unit1 = await Unit.findOne({ shortSingular: 'tbsp' });
        const unit2 = await Unit.findOne({ shortSingular: 'cup' });
        const rule1 = await ConversionRule.findOne({ unit: unit1._id });
        const rule2 = await ConversionRule.findOne({ unit: unit2._id });
        const record = { baseUnit: baseUnit._id, rules: [rule1._id, rule2._id] };
        const response = await createUnitConversion(this, user, record);
        const createdUnitConversion = parseCreatedUnitConversion(response);
        const updateRule = await ConversionRule.findOne({ unit: baseUnit._id });
        const update = { baseUnit: unit1._id, rules: [rule2._id, updateRule._id] };
        const updateResponse = await updateUnitConversion(
            this,
            user,
            createdUnitConversion._id,
            update
        );
        assert(updateResponse.body.kind === 'single');
        assert.isUndefined(updateResponse.body.singleResult.errors);
        const updatedUnitConversion = parseUpdatedUnitConversion(updateResponse);
        assert.equal(updatedUnitConversion.baseUnit._id, unit1._id);
    });

    it('should create a unit conversion where the base unit is the same as one of the rules', async function () {
        const user = await User.findOne({ username: 'testuser1' });
        const baseUnit = await Unit.findOne({ shortSingular: 'tsp' });
        const unit1 = await Unit.findOne({ shortSingular: 'tbsp' });
        const unit2 = await Unit.findOne({ shortSingular: 'cup' });
        const rule1 = await ConversionRule.findOne({ unit: unit1._id });
        const rule2 = await ConversionRule.findOne({ unit: unit2._id });
        const rule3 = await ConversionRule.findOne({ unit: baseUnit._id });
        const record = { baseUnit: baseUnit._id, rules: [rule1._id, rule2._id] };
        const response = await createUnitConversion(this, user, record);
        const createdUnitConversion = parseCreatedUnitConversion(response);
        const update = { rules: [rule2._id, rule3._id] };
        const updateResponse = await updateUnitConversion(
            this,
            user,
            createdUnitConversion._id,
            update
        );
        assert(updateResponse.body.kind === 'single');
        assert.isUndefined(updateResponse.body.singleResult.errors);
        const updatedUnitConversion = parseUpdatedUnitConversion(updateResponse);
        assert.equal(updatedUnitConversion.baseUnit._id, baseUnit._id);
    });

    it('should update a unit, and the rules should be sorted by baseUnitThreshold', async function () {
        const user = await User.findOne({ username: 'testuser1' });
        const baseUnit = await Unit.findOne({ shortSingular: 'tsp' });
        const unit1 = await Unit.findOne({ shortSingular: 'tbsp' });
        const unit2 = await Unit.findOne({ shortSingular: 'cup' });
        const rule1 = await ConversionRule.findOne({ unit: unit1._id });
        const rule2 = await ConversionRule.findOne({ unit: unit2._id });
        const rule3 = await ConversionRule.findOne({ unit: baseUnit._id });
        rule1.baseUnitThreshold = 2;
        rule2.baseUnitThreshold = 4;
        rule3.baseUnitThreshold = 6;
        await rule1.save();
        await rule2.save();
        await rule3.save();
        const record = { baseUnit: baseUnit._id, rules: [rule2._id, rule1._id] };
        const response = await createUnitConversion(this, user, record);
        const createdUnitConversion = parseCreatedUnitConversion(response);
        const update = { rules: [rule3._id, rule2._id] };
        const updateResponse = await updateUnitConversion(
            this,
            user,
            createdUnitConversion._id,
            update
        );
        assert(updateResponse.body.kind === 'single');
        assert.isUndefined(updateResponse.body.singleResult.errors);
        const updatedUnitConversion = parseUpdatedUnitConversion(updateResponse);
        assert.equal(updatedUnitConversion.rules.length, 2);
        assert.equal(updatedUnitConversion.rules[1]._id, rule2._id);
        assert.equal(updatedUnitConversion.rules[0]._id, rule3._id);
    });
});
