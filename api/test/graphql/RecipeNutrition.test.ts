import { assert } from 'chai';
import mongoose, { Types } from 'mongoose';
import { ApolloServer } from '@apollo/server';
import { after, afterEach, before, beforeEach, describe, it } from 'mocha';

import { Size } from '../../src/models/Size.js';
import { Unit } from '../../src/models/Unit.js';
import { User } from '../../src/models/User.js';
import { Recipe } from '../../src/models/Recipe.js';
import { createAdmin, createUser } from '../utils/data.js';
import { PrepMethod } from '../../src/models/PrepMethod.js';
import { Ingredient } from '../../src/models/Ingredient.js';
import { startServer, stopServer } from '../utils/mongodb.js';
import { syncStandardUnits } from '../../src/utils/standardUnits.js';
import { NutritionalInfo } from '../../src/models/NutritionalInfo.js';
import { validateItemNotInRecipe } from '../../src/schema/validation.js';
import { IngredientMeasure } from '../../src/models/IngredientMeasure.js';

const NUTRITION = `
    query Nutrition($id: MongoID!) {
        recipeById(_id: $id) {
            yield { quantity unit { longSingular } }
            nutrition {
                total { calories protein carbs fat }
                ingredients {
                    recipeIngredient
                    status
                    macros { calories }
                    reason { code message }
                    childUncounted
                    childRecipe
                }
            }
        }
    }`;

interface NutritionResult {
    recipeById: {
        yield: Array<{ quantity: string; unit: { longSingular: string } }> | null;
        nutrition: {
            total: { calories: number; protein: number; carbs: number; fat: number };
            ingredients: Array<{
                recipeIngredient: string;
                status: string;
                macros: { calories: number };
                reason: { code: string; message: string } | null;
                childUncounted: number | null;
                childRecipe: string | null;
            }>;
        };
    };
}

const PER_GRAM = { calories: 2, protein: 0.1, carbs: 0.2, fat: 0.05 };

let user: User;
let units: { gram: Types.ObjectId; cup: Types.ObjectId; each: Types.ObjectId };

async function unitId(standard: string): Promise<Types.ObjectId> {
    return (await Unit.findOne({ standard }).orFail())._id as Types.ObjectId;
}

function recipeIngredient(
    ingredient: Types.ObjectId,
    quantity: string | null,
    unit: Types.ObjectId | null,
    extra = {}
) {
    return { ingredient, quantity, unit, ...extra };
}

/** A recipe with the fields every recipe needs, and these ingredients. */
function recipe(title: string, ingredients: object[], extra: object = {}) {
    return new Recipe({
        title,
        titleIdentifier: `${title.toLowerCase().replace(/\W+/g, '-')}-test`,
        ingredientSubsections: [{ ingredients }],
        instructionSubsections: [{ instructions: ['Mix.'] }],
        owner: user._id,
        numServings: 2,
        isIngredient: true,
        createdAt: new Date(),
        lastModified: new Date(),
        ...extra,
    });
}

async function ingredient(
    name: string,
    perGram: typeof PER_GRAM | null = PER_GRAM
): Promise<Types.ObjectId> {
    const doc = await new Ingredient({
        name,
        pluralName: `${name}s`,
        isCountable: false,
        owner: user._id,
        tags: [],
    }).save();
    if (perGram) {
        await new NutritionalInfo({ ingredient: doc._id, source: 'manual', perGram }).save();
    }
    return doc._id as Types.ObjectId;
}

async function countUnit(name: string): Promise<Types.ObjectId> {
    const doc = await new Unit({
        shortSingular: name,
        shortPlural: `${name}s`,
        longSingular: name,
        longPlural: `${name}s`,
        preferredNumberFormat: 'decimal',
        owner: user._id,
        hasSpace: true,
        unique: true,
        dimension: 'count',
        perCanonical: 1,
    }).save();
    return doc._id as Types.ObjectId;
}

/** Rejects with an error whose extensions carry `code`. */
async function rejectsWithCode(promise: Promise<unknown>, code: string) {
    try {
        await promise;
    } catch (error) {
        assert.equal((error as { extensions?: { code?: string } }).extensions?.code, code);
        return;
    }
    assert.fail(`Expected ${code}`);
}

describe('recipe yields and recipes used as ingredients', function () {
    before(startServer);
    after(stopServer);
    beforeEach(async function () {
        await createAdmin();
        user = await createUser();
        await syncStandardUnits(mongoose.connection.db);
        units = {
            gram: await unitId('gram'),
            cup: await unitId('cup'),
            each: await unitId('each'),
        };
    });
    afterEach(async function () {
        await mongoose.connection.db.dropDatabase();
    });

    describe('yield', function () {
        it('saves rows in different dimensions', async function () {
            const flour = await ingredient('flour');
            const saved = await recipe('Dough', [recipeIngredient(flour, '500', units.gram)], {
                yield: [
                    { quantity: '2', unit: units.each },
                    { quantity: '900', unit: units.gram },
                ],
            }).save();
            assert.lengthOf(saved.yield!, 2);
        });

        it('refuses two rows in one dimension', async function () {
            const flour = await ingredient('flour');
            const kilogram = await unitId('kilogram');
            try {
                await recipe('Dough', [recipeIngredient(flour, '500', units.gram)], {
                    yield: [
                        { quantity: '900', unit: units.gram },
                        { quantity: '1', unit: kilogram },
                    ],
                }).save();
                assert.fail('Expected a validation error');
            } catch (error) {
                assert.include(
                    (error as Error).message,
                    'one yield for weight, volume, and each count unit'
                );
            }
        });

        it('saves rows in two count units', async function () {
            const flour = await ingredient('flour');
            const slice = await countUnit('slice');
            const saved = await recipe('Pizza', [recipeIngredient(flour, '500', units.gram)], {
                yield: [
                    { quantity: '2', unit: units.each },
                    { quantity: '8', unit: slice },
                ],
            }).save();
            assert.lengthOf(saved.yield!, 2);
        });

        it('refuses two rows in one count unit', async function () {
            const flour = await ingredient('flour');
            try {
                await recipe('Pizza', [recipeIngredient(flour, '500', units.gram)], {
                    yield: [
                        { quantity: '2', unit: units.each },
                        { quantity: '3', unit: units.each },
                    ],
                }).save();
                assert.fail('Expected a validation error');
            } catch (error) {
                assert.include(
                    (error as Error).message,
                    'one yield for weight, volume, and each count unit'
                );
            }
        });

        it('refuses a quantity in the wrong format', async function () {
            const flour = await ingredient('flour');
            try {
                await recipe('Dough', [recipeIngredient(flour, '500', units.gram)], {
                    yield: [{ quantity: 'about 2', unit: units.each }],
                }).save();
                assert.fail('Expected a validation error');
            } catch (error) {
                assert.include((error as Error).message, 'Invalid yield quantity format');
            }
        });

        it('is optional', async function () {
            const flour = await ingredient('flour');
            const saved = await recipe('Dough', [
                recipeIngredient(flour, '500', units.gram),
            ]).save();
            assert.isUndefined(saved.yield);
        });
    });

    describe('recipes used as ingredients', function () {
        it('refuses a size on a recipe used as an ingredient', async function () {
            const flour = await ingredient('flour');
            const dough = await recipe('Dough', [
                recipeIngredient(flour, '500', units.gram),
            ]).save();
            const large = await new Size({ value: 'large', owner: user._id, unique: true }).save();
            await rejectsWithCode(
                recipe('Pizza', [
                    recipeIngredient(dough._id as Types.ObjectId, '1', units.each, {
                        size: large._id,
                    }),
                ]).save(),
                'RECIPE_INGREDIENT_SIZE'
            );
        });

        it('refuses a recipe that is not marked as an ingredient', async function () {
            const flour = await ingredient('flour');
            const dinner = await recipe('Dinner', [recipeIngredient(flour, '500', units.gram)], {
                isIngredient: false,
            }).save();
            await rejectsWithCode(
                recipe('Pizza', [
                    recipeIngredient(dinner._id as Types.ObjectId, '1', units.each),
                ]).save(),
                'RECIPE_INGREDIENT_NOT_INGREDIENT'
            );
        });

        it('refuses a recipe that leads back to itself', async function () {
            const flour = await ingredient('flour');
            const a = await recipe('A', [recipeIngredient(flour, '1', units.gram)]).save();
            const b = await recipe('B', [
                recipeIngredient(a._id as Types.ObjectId, '1', units.gram),
            ]).save();
            const c = await recipe('C', [
                recipeIngredient(b._id as Types.ObjectId, '1', units.gram),
            ]).save();
            // A → C → B → A
            a.ingredientSubsections = [
                { ingredients: [recipeIngredient(c._id as Types.ObjectId, '1', units.gram)] },
            ] as never;
            await rejectsWithCode(a.save(), 'RECIPE_INGREDIENT_CYCLE');
        });

        it('refuses a recipe that uses itself', async function () {
            const flour = await ingredient('flour');
            const a = await recipe('A', [recipeIngredient(flour, '1', units.gram)]).save();
            a.ingredientSubsections = [
                { ingredients: [recipeIngredient(a._id as Types.ObjectId, '1', units.gram)] },
            ] as never;
            await rejectsWithCode(a.save(), 'RECIPE_INGREDIENT_CYCLE');
        });

        it('allows the same recipe twice, and in two branches', async function () {
            const flour = await ingredient('flour');
            const a = await recipe('A', [recipeIngredient(flour, '1', units.gram)]).save();
            const b = await recipe('B', [
                recipeIngredient(a._id as Types.ObjectId, '1', units.gram),
            ]).save();
            await recipe('C', [
                recipeIngredient(a._id as Types.ObjectId, '1', units.gram),
                recipeIngredient(b._id as Types.ObjectId, '1', units.gram),
            ]).save();
        });
    });

    describe('Recipe.nutrition', function () {
        async function query(server: ApolloServer, id: unknown) {
            const response = await server.executeOperation(
                { query: NUTRITION, variables: { id: String(id) } },
                { contextValue: { isAuthenticated: () => true, getUser: () => user } }
            );
            if (response.body.kind !== 'single') assert.fail('Expected a single result');
            assert.isUndefined(response.body.singleResult.errors);
            return (response.body.singleResult.data as unknown as NutritionResult).recipeById;
        }

        /** Salad uses 300 g of a couscous recipe that makes 600 g, and salt with no quantity. */
        async function salad() {
            const flour = await ingredient('flour');
            const stock = await ingredient('stock pot');
            const salt = await ingredient('salt');
            await new IngredientMeasure({ ingredient: stock, unit: units.each, grams: 26 }).save();
            const couscous = await recipe(
                'Pearl Couscous',
                [
                    recipeIngredient(flour, '100', units.gram),
                    recipeIngredient(stock, '1', units.each),
                ],
                { yield: [{ quantity: '600', unit: units.gram }] }
            ).save();
            const saladDoc = await recipe('Salad', [
                recipeIngredient(couscous._id as Types.ObjectId, '300', units.gram),
                recipeIngredient(salt, null, null),
            ]).save();
            return { saladDoc, couscous, stock };
        }

        it('counts a share of a recipe used as an ingredient', async function () {
            const { saladDoc, couscous } = await salad();
            const result = await query(this.apolloServer, saladDoc._id);
            const [couscousResult, saltResult] = result.nutrition.ingredients;
            // Couscous makes (100 + 26) g × 2 kcal = 252 kcal per 600 g; half is used.
            assert.equal(couscousResult.status, 'COUNTED');
            assert.closeTo(couscousResult.macros.calories, 126, 1e-9);
            assert.equal(couscousResult.childRecipe, String(couscous._id));
            assert.equal(saltResult.status, 'UNCOUNTED');
            assert.deepEqual(saltResult.reason, { code: 'NO_QUANTITY', message: 'No quantity' });
            assert.closeTo(result.nutrition.total.calories, 126, 1e-9);
            assert.closeTo(result.nutrition.total.fat, 126 / 40, 1e-9);
        });

        it('shows the yield with its unit', async function () {
            const { couscous } = await salad();
            const result = await query(this.apolloServer, couscous._id);
            assert.deepEqual(result.yield, [{ quantity: '600', unit: { longSingular: 'gram' } }]);
        });

        it('marks a recipe used as an ingredient partial when the child has uncounted ingredients', async function () {
            const { saladDoc } = await salad();
            await IngredientMeasure.deleteMany({});
            const [couscousResult] = (await query(this.apolloServer, saladDoc._id)).nutrition
                .ingredients;
            assert.equal(couscousResult.status, 'PARTIAL');
            assert.equal(couscousResult.childUncounted, 1);
            assert.equal(couscousResult.reason?.code, 'CHILD_PARTIAL');
            assert.closeTo(couscousResult.macros.calories, 100, 1e-9);
        });

        it('leaves a recipe used as an ingredient uncounted when the child has no yield', async function () {
            const { saladDoc, couscous } = await salad();
            await Recipe.updateOne({ _id: couscous._id }, { $unset: { yield: '' } });
            const [couscousResult] = (await query(this.apolloServer, saladDoc._id)).nutrition
                .ingredients;
            assert.deepEqual(couscousResult.reason, {
                code: 'NO_YIELD',
                message: 'No yield recorded for Pearl Couscous',
            });
            assert.equal(couscousResult.macros.calories, 0);
        });

        it('stops at a cycle that is already in the data', async function () {
            const { saladDoc, couscous } = await salad();
            // Written past validation, as old data could be.
            await Recipe.updateOne(
                { _id: couscous._id },
                {
                    $push: {
                        'ingredientSubsections.0.ingredients': {
                            _id: new Types.ObjectId(),
                            type: 'recipe',
                            ingredient: saladDoc._id,
                            quantity: '1',
                            unit: units.gram,
                        },
                    },
                }
            );
            await Recipe.updateOne(
                { _id: saladDoc._id },
                { $set: { yield: [{ quantity: '500', unit: units.gram }] } }
            );
            const result = await query(this.apolloServer, couscous._id);
            const saladResult = result.nutrition.ingredients[2];
            assert.equal(saladResult.status, 'PARTIAL');
        });

        describe('prep methods', function () {
            const LIME = { calories: 0.3, protein: 0.007, carbs: 0.106, fat: 0.002 };
            const JUICE = { calories: 0.25, protein: 0.004, carbs: 0.084, fat: 0.001 };

            async function prep(value: string): Promise<Types.ObjectId> {
                const doc = await new PrepMethod({ value, unique: true, owner: user._id }).save();
                return doc._id as Types.ObjectId;
            }

            async function limes() {
                const juiced = await prep('juiced');
                const sliced = await prep('sliced');
                const lime = await ingredient('lime', LIME);
                await new NutritionalInfo({
                    ingredient: lime,
                    prepMethod: juiced,
                    source: 'manual',
                    perGram: JUICE,
                }).save();
                await new IngredientMeasure({
                    ingredient: lime,
                    unit: units.each,
                    grams: 67,
                }).save();
                await new IngredientMeasure({
                    ingredient: lime,
                    unit: units.each,
                    prepMethod: juiced,
                    grams: 44,
                }).save();
                return { lime, juiced, sliced };
            }

            it('uses the record for the prep method', async function () {
                const { lime, juiced } = await limes();
                const doc = await recipe('Dressing', [
                    recipeIngredient(lime, '1', units.each, { prepMethod: juiced }),
                ]).save();
                const [result] = (await query(this.apolloServer, doc._id)).nutrition.ingredients;
                assert.equal(result.status, 'COUNTED');
                assert.closeTo(result.macros.calories, 44 * 0.25, 1e-9);
            });

            it('uses the record with no prep method for another prep method, or none', async function () {
                const { lime, sliced } = await limes();
                const doc = await recipe('Garnish', [
                    recipeIngredient(lime, '1', units.each, { prepMethod: sliced }),
                    recipeIngredient(lime, '1', units.each),
                ]).save();
                const results = (await query(this.apolloServer, doc._id)).nutrition.ingredients;
                assert.closeTo(results[0].macros.calories, 67 * 0.3, 1e-9);
                assert.closeTo(results[1].macros.calories, 67 * 0.3, 1e-9);
            });

            it('leaves a line uncounted when only another prep method has a record', async function () {
                const { lime, juiced } = await limes();
                await NutritionalInfo.deleteOne({ ingredient: lime, prepMethod: null });
                const doc = await recipe('Garnish', [
                    recipeIngredient(lime, '1', units.each),
                    recipeIngredient(lime, '1', units.each, { prepMethod: juiced }),
                ]).save();
                const results = (await query(this.apolloServer, doc._id)).nutrition.ingredients;
                assert.deepEqual(results[0].reason, {
                    code: 'NO_NUTRITION',
                    message: 'No nutritional data for lime',
                });
                assert.equal(results[1].status, 'COUNTED');
            });

            it('reads a record saved before prep methods, with no prepMethod field', async function () {
                const stock = await ingredient('stock', null);
                await mongoose.connection.db
                    .collection('nutritionalinfos')
                    .insertOne({ ingredient: stock, source: 'manual', perGram: PER_GRAM });
                const doc = await recipe('Soup', [
                    recipeIngredient(stock, '100', units.gram),
                ]).save();
                const [result] = (await query(this.apolloServer, doc._id)).nutrition.ingredients;
                assert.closeTo(result.macros.calories, 200, 1e-9);
            });
        });

        it('names the missing weight of an ingredient', async function () {
            const { couscous, stock } = await salad();
            await IngredientMeasure.deleteMany({ ingredient: stock });
            const results = (await query(this.apolloServer, couscous._id)).nutrition.ingredients;
            assert.deepEqual(results[1].reason, {
                code: 'NO_MEASURE',
                message: 'No weight recorded for 1 stock pot',
            });
        });

        describe('nutrition overrides', function () {
            async function run(
                server: ApolloServer,
                query: string,
                variables: Record<string, unknown>,
                asUser: User = user
            ) {
                const response = await server.executeOperation(
                    { query, variables },
                    { contextValue: { isAuthenticated: () => true, getUser: () => asUser } }
                );
                if (response.body.kind !== 'single') assert.fail('Expected a single result');
                return response.body.singleResult;
            }

            const SET_OVERRIDE = `
            mutation Set($id: MongoID!, $line: MongoID!, $override: RecipeIngredientNutritionOverrideInput) {
                recipeSetNutritionOverride(_id: $id, recipeIngredient: $line, nutritionOverride: $override) {
                    record {
                        ingredientSubsections {
                            ingredients {
                                quantity
                                nutritionOverride { mode percent quantity unit { longSingular } }
                            }
                        }
                        nutrition { ingredients { status macros { calories } } }
                    }
                }
            }`;

            const PREVIEW = `
            query Preview($recipeId: MongoID, $ingredients: [NutritionDraftIngredientInput!]!) {
                recipeNutritionPreview(recipeId: $recipeId, ingredients: $ingredients) {
                    total { calories }
                    ingredients { status macros { calories } reason { code } }
                }
            }`;

            /** Frying uses a cup of oil, and the pepper has no quantity. */
            async function fried() {
                const oil = await ingredient('oil');
                const pepper = await ingredient('pepper');
                await new IngredientMeasure({
                    ingredient: oil,
                    unit: units.cup,
                    grams: 200,
                }).save();
                const doc = await recipe('Fried', [
                    recipeIngredient(oil, '1', units.cup),
                    recipeIngredient(pepper, null, null),
                ]).save();
                const [oilLine, pepperLine] = doc.ingredientSubsections[0].ingredients;
                return { doc, oil, pepper, oilLine, pepperLine };
            }

            it('saves an override with the recipe and counts it', async function () {
                const oil = await ingredient('oil');
                await new IngredientMeasure({
                    ingredient: oil,
                    unit: units.cup,
                    grams: 200,
                }).save();
                const doc = await recipe('Fried', [
                    recipeIngredient(oil, '1', units.cup, {
                        nutritionOverride: { mode: 'share', percent: 10 },
                    }),
                ]).save();
                const [result] = (await query(this.apolloServer, doc._id)).nutrition.ingredients;
                assert.equal(result.status, 'COUNTED');
                assert.closeTo(result.macros.calories, 200 * 2 * 0.1, 1e-9);
            });

            it('refuses a share on a line with no quantity', async function () {
                const pepper = await ingredient('pepper');
                await rejectsWithCode(
                    recipe('Seasoned', [
                        recipeIngredient(pepper, null, null, {
                            nutritionOverride: { mode: 'share', percent: 10 },
                        }),
                    ]).save(),
                    'BAD_USER_INPUT'
                );
            });

            it('refuses a set amount with no unit, and a percentage on another mode', async function () {
                const pepper = await ingredient('pepper');
                await rejectsWithCode(
                    recipe('Seasoned', [
                        recipeIngredient(pepper, null, null, {
                            nutritionOverride: { mode: 'amount', quantity: '1' },
                        }),
                    ]).save(),
                    'BAD_USER_INPUT'
                );
                await rejectsWithCode(
                    recipe('Seasoned', [
                        recipeIngredient(pepper, null, null, {
                            nutritionOverride: { mode: 'negligible', percent: 5 },
                        }),
                    ]).save(),
                    'BAD_USER_INPUT'
                );
            });

            it('sets and clears the override of one line', async function () {
                const { doc, pepperLine } = await fried();
                const variables = {
                    id: String(doc._id),
                    line: String(pepperLine._id),
                    override: { mode: 'amount', quantity: '1/2', unit: String(units.gram) },
                };
                const set = await run(this.apolloServer, SET_OVERRIDE, variables);
                assert.isUndefined(set.errors);
                const record = (
                    set.data as {
                        recipeSetNutritionOverride: {
                            record: {
                                ingredientSubsections: Array<{
                                    ingredients: Array<{
                                        quantity: string | null;
                                        nutritionOverride: {
                                            mode: string;
                                            quantity: string;
                                            unit: { longSingular: string };
                                        } | null;
                                    }>;
                                }>;
                                nutrition: {
                                    ingredients: Array<{
                                        status: string;
                                        macros: { calories: number };
                                    }>;
                                };
                            };
                        };
                    }
                ).recipeSetNutritionOverride.record;
                const pepper = record.ingredientSubsections[0].ingredients[1];
                assert.isNull(pepper.quantity, 'the line itself does not change');
                assert.equal(pepper.nutritionOverride?.mode, 'amount');
                assert.equal(pepper.nutritionOverride?.unit.longSingular, 'gram');
                assert.equal(record.nutrition.ingredients[1].status, 'COUNTED');
                assert.closeTo(record.nutrition.ingredients[1].macros.calories, 1, 1e-9);

                const cleared = await run(this.apolloServer, SET_OVERRIDE, {
                    ...variables,
                    override: null,
                });
                assert.isUndefined(cleared.errors);
                const saved = await Recipe.findById(doc._id).lean();
                assert.isUndefined(
                    saved!.ingredientSubsections[0].ingredients[1].nutritionOverride
                );
            });

            it('refuses to set the override of a line on a recipe the user does not own', async function () {
                const { doc, oilLine } = await fried();
                const other = await User.register(
                    new User({ username: 'other', firstName: 'O', lastName: 'T', role: 'user' }),
                    'password'
                );
                const result = await run(
                    this.apolloServer,
                    SET_OVERRIDE,
                    {
                        id: String(doc._id),
                        line: String(oilLine._id),
                        override: { mode: 'negligible' },
                    },
                    other
                );
                assert.equal(result.errors?.[0].extensions?.code, 'FORBIDDEN');
            });

            it('refuses an override that does not fit the line', async function () {
                const { doc, pepperLine } = await fried();
                const result = await run(this.apolloServer, SET_OVERRIDE, {
                    id: String(doc._id),
                    line: String(pepperLine._id),
                    override: { mode: 'share', percent: 10 },
                });
                assert.equal(result.errors?.[0].extensions?.code, 'BAD_USER_INPUT');
            });

            it('previews a draft, in the order given, with its overrides', async function () {
                const { oil, pepper } = await fried();
                const result = await run(this.apolloServer, PREVIEW, {
                    ingredients: [
                        {
                            ingredient: String(oil),
                            quantity: '1',
                            unit: String(units.cup),
                            nutritionOverride: { mode: 'share', percent: 15 },
                        },
                        { ingredient: String(pepper) },
                        { ingredient: String(pepper), nutritionOverride: { mode: 'negligible' } },
                    ],
                });
                assert.isUndefined(result.errors);
                const preview = (
                    result.data as {
                        recipeNutritionPreview: {
                            total: { calories: number };
                            ingredients: Array<{ status: string; reason: { code: string } | null }>;
                        };
                    }
                ).recipeNutritionPreview;
                assert.closeTo(preview.total.calories, 200 * 2 * 0.15, 1e-9);
                assert.deepEqual(
                    preview.ingredients.map((line) => line.status),
                    ['COUNTED', 'UNCOUNTED', 'COUNTED']
                );
                assert.equal(preview.ingredients[1].reason?.code, 'NO_QUANTITY');
            });

            it('previews a recipe used as an ingredient, and a quantity with no unit as each', async function () {
                const { saladDoc, couscous } = await salad();
                const stock = await Ingredient.findOne({ name: 'stock pot' }).orFail();
                const result = await run(this.apolloServer, PREVIEW, {
                    recipeId: String(saladDoc._id),
                    ingredients: [
                        {
                            ingredient: String(couscous._id),
                            quantity: '300',
                            unit: String(units.gram),
                        },
                        { ingredient: String(stock._id), quantity: '1' },
                    ],
                });
                assert.isUndefined(result.errors);
                const preview = (
                    result.data as { recipeNutritionPreview: { total: { calories: number } } }
                ).recipeNutritionPreview;
                assert.closeTo(preview.total.calories, 126 + 52, 1e-9);
            });

            it('keeps a unit used only by an override in use', async function () {
                const pepper = await ingredient('pepper');
                const pinch = await countUnit('pinch');
                await recipe('Seasoned', [
                    recipeIngredient(pepper, null, null, {
                        nutritionOverride: { mode: 'amount', quantity: '1', unit: pinch },
                    }),
                ]).save();
                await rejectsWithCode(validateItemNotInRecipe(pinch, 'unit'), 'ITEM_IN_USE');
            });

            it('refuses a preview to a user who is not signed in', async function () {
                const response = await this.apolloServer.executeOperation(
                    { query: PREVIEW, variables: { ingredients: [] } },
                    { contextValue: { isAuthenticated: () => false, getUser: () => null } }
                );
                if (response.body.kind !== 'single') assert.fail('Expected a single result');
                assert.equal(
                    response.body.singleResult.errors?.[0].extensions?.code,
                    'UNAUTHENTICATED'
                );
            });
        });
    });
});
