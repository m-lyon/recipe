import { expect } from 'chai';

import { toRecipeFile } from '../src/lib/recipeFile.js';
import { CliError, ExitCode } from '../src/lib/errors.js';
import type { RecipeFileComponents, RecipeFileSource } from '../src/lib/recipeFile.js';
import { changedKeys, parseRecipeFile, resolveRecipeFile } from '../src/lib/recipeFile.js';
import { CHOPPED, CUP, EACH, GRAM, INGREDIENTS, LARGE, UNITS } from './helpers/fixtures.js';

const COUSCOUS = {
    _id: 'rec-couscous',
    title: 'Pearl Couscous',
    titleIdentifier: 'pearl-couscous-x1y2z',
    isIngredient: true,
    archived: false,
};
const SOUP_TAG = { _id: 'tag-soup', value: 'soup' };

const COMPONENTS: RecipeFileComponents = {
    ingredients: INGREDIENTS,
    recipes: [COUSCOUS],
    units: UNITS,
    sizes: [LARGE],
    prepMethods: [CHOPPED],
    tags: [SOUP_TAG],
};

const FILE = {
    title: 'Egg fried couscous',
    numServings: 2,
    tags: ['soup'],
    yield: [{ quantity: '600', unit: 'g' }],
    ingredientSubsections: [
        {
            ingredients: [
                { quantity: 2, size: 'large', ingredient: 'eggs' },
                { quantity: '1', unit: 'cup', ingredient: 'flour', prepMethod: 'chopped' },
                { quantity: '300', unit: 'g', recipe: 'pearl-couscous-x1y2z' },
            ],
        },
    ],
    instructionSubsections: [{ instructions: ['Fry the eggs.', 'Add the couscous.'] }],
};

function expectCliError(fn: () => unknown, exit: number): CliError {
    try {
        fn();
    } catch (error) {
        expect(error).to.be.instanceOf(CliError);
        expect((error as CliError).exitCode).to.equal(exit);
        return error as CliError;
    }
    throw new Error('expected a CliError');
}

describe('recipe file', () => {
    describe('parseRecipeFile', () => {
        it('accepts a complete file to create', () => {
            expect(parseRecipeFile(JSON.stringify(FILE), 'create').title).to.equal(FILE.title);
        });

        it('needs the required keys only to create', () => {
            const raw = JSON.stringify({ notes: 'Better the next day.' });
            const error = expectCliError(() => parseRecipeFile(raw, 'create'), ExitCode.REJECTED);
            expect(error.details?.problems).to.include.members([
                'title: is required to create a recipe',
                'numServings: is required to create a recipe',
            ]);
            expect(parseRecipeFile(raw, 'update').notes).to.equal('Better the next day.');
        });

        it('reports every problem at once', () => {
            const raw = JSON.stringify({
                titel: 'typo',
                numServings: 0,
                ingredientSubsections: [
                    { name: 'A', ingredients: [{ quantity: '1' }] },
                    { ingredients: [{ ingredient: 'egg', recipe: 'x', colour: 'red' }] },
                ],
            });
            const error = expectCliError(() => parseRecipeFile(raw, 'update'), ExitCode.REJECTED);
            expect(error.details?.problems).to.deep.equal([
                'recipe: unknown key "titel"',
                'numServings: must be a positive number',
                'ingredientSubsections[0].ingredients[0]: needs exactly one of "ingredient" and "recipe"',
                'ingredientSubsections[1].name: is required when there is more than one subsection',
                'ingredientSubsections[1].ingredients[0]: unknown key "colour"',
                'ingredientSubsections[1].ingredients[0]: needs exactly one of "ingredient" and "recipe"',
            ]);
        });

        it('rejects text that is not JSON', () => {
            expectCliError(() => parseRecipeFile('{ title: ', 'create'), ExitCode.REJECTED);
        });
    });

    describe('resolveRecipeFile', () => {
        it('resolves every name to an id', () => {
            const { record, lines } = resolveRecipeFile(
                parseRecipeFile(JSON.stringify(FILE), 'create'),
                COMPONENTS
            );
            expect(record).to.deep.equal({
                title: 'Egg fried couscous',
                numServings: 2,
                tags: ['tag-soup'],
                yield: [{ quantity: '600', unit: GRAM._id }],
                ingredientSubsections: [
                    {
                        name: null,
                        ingredients: [
                            {
                                quantity: '2',
                                unit: null,
                                size: LARGE._id,
                                prepMethod: null,
                                ingredient: 'ing-egg',
                            },
                            {
                                quantity: '1',
                                unit: CUP._id,
                                size: null,
                                prepMethod: CHOPPED._id,
                                ingredient: 'ing-flour',
                            },
                            {
                                quantity: '300',
                                unit: GRAM._id,
                                size: null,
                                prepMethod: null,
                                ingredient: COUSCOUS._id,
                            },
                        ],
                    },
                ],
                instructionSubsections: [
                    { name: null, instructions: ['Fry the eggs.', 'Add the couscous.'] },
                ],
            });
            expect(lines[0].lines).to.deep.equal([
                '2 large egg',
                '1 cup flour, chopped',
                '300 g Pearl Couscous (recipe)',
            ]);
        });

        it('passes a MongoID through, for a one-recipe unit', () => {
            const id = 'a'.repeat(24);
            const { record } = resolveRecipeFile(
                { ingredientSubsections: [{ ingredients: [{ unit: id, ingredient: 'egg' }] }] },
                COMPONENTS
            );
            expect(record.ingredientSubsections?.[0].ingredients[0].unit).to.equal(id);
        });

        it('reports every reference that does not resolve, with candidates', () => {
            const error = expectCliError(
                () =>
                    resolveRecipeFile(
                        {
                            tags: ['stew'],
                            ingredientSubsections: [
                                {
                                    ingredients: [
                                        { unit: 'scoop', ingredient: 'egg' },
                                        { ingredient: 'stock' },
                                        { recipe: 'no-such-recipe' },
                                    ],
                                },
                            ],
                        },
                        COMPONENTS
                    ),
                ExitCode.NOT_FOUND
            );
            const problems = error.details?.problems as Array<{
                path: string;
                candidates?: unknown[];
            }>;
            expect(problems.map((p) => p.path)).to.deep.equal([
                'tags[0]',
                'ingredientSubsections[0].ingredients[0].unit',
                'ingredientSubsections[0].ingredients[1].ingredient',
                'ingredientSubsections[0].ingredients[2].recipe',
            ]);
            expect(problems[2].candidates).to.have.length(2);
        });
    });

    describe('toRecipeFile', () => {
        const SOURCE: RecipeFileSource = {
            _id: 'rec-1',
            title: 'Egg fried couscous',
            titleIdentifier: 'egg-fried-couscous-abcde',
            pluralTitle: null,
            subTitle: null,
            source: null,
            notes: null,
            numServings: 2,
            isIngredient: false,
            tags: [SOUP_TAG],
            yield: [{ quantity: '600', unit: GRAM }],
            ingredientSubsections: [
                {
                    name: null,
                    ingredients: [
                        {
                            quantity: '2',
                            unit: EACH,
                            size: LARGE,
                            prepMethod: null,
                            ingredient: { ...INGREDIENTS[0], __typename: 'Ingredient' as const },
                        },
                        {
                            quantity: '1',
                            unit: {
                                ...CUP,
                                _id: 'unit-throwaway',
                                longSingular: 'mug',
                                shortSingular: 'mug',
                            },
                            ingredient: { ...INGREDIENTS[4], __typename: 'Ingredient' as const },
                        },
                        {
                            quantity: '300',
                            unit: GRAM,
                            ingredient: {
                                __typename: 'Recipe',
                                _id: COUSCOUS._id,
                                title: COUSCOUS.title,
                                titleIdentifier: COUSCOUS.titleIdentifier,
                            },
                        },
                    ],
                },
            ],
            instructionSubsections: [{ name: null, instructions: ['Fry.'] }],
        };

        it('writes names, and ids where a name does not resolve back', () => {
            const file = toRecipeFile(SOURCE, COMPONENTS);
            expect(file.ingredientSubsections[0].ingredients).to.deep.equal([
                { quantity: '2', size: 'large', ingredient: 'egg' },
                { quantity: '1', unit: 'unit-throwaway', ingredient: 'ing-dup-a' },
                { quantity: '300', unit: 'g', recipe: COUSCOUS.titleIdentifier },
            ]);
            expect(file.tags).to.deep.equal(['soup']);
            expect(file.yield).to.deep.equal([{ quantity: '600', unit: 'g' }]);
        });

        it('round trips: the exported file changes nothing', () => {
            const file = toRecipeFile(SOURCE, COMPONENTS);
            expect(changedKeys(JSON.parse(JSON.stringify(file)), file)).to.deep.equal([]);
        });

        it('names the keys that differ', () => {
            const file = toRecipeFile(SOURCE, COMPONENTS);
            expect(
                changedKeys({ ...file, title: 'New', notes: null, tags: [] }, file)
            ).to.deep.equal(['title', 'tags']);
        });
    });
});
