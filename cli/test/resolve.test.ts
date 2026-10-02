import { expect } from 'chai';

import { ExitCode } from '../src/lib/errors.js';
import { INGREDIENTS } from './helpers/fixtures.js';
import { matchIngredient } from '../src/lib/resolve.js';
import type { IngredientSummary } from '../src/lib/types.js';

const ingredients = INGREDIENTS as unknown as IngredientSummary[];

function thrown(fn: () => unknown): { exitCode: number; errorCode: string; message: string } {
    try {
        fn();
    } catch (error) {
        return error as { exitCode: number; errorCode: string; message: string };
    }
    throw new Error('expected a throw');
}

describe('identifier resolution', () => {
    it('matches an exact name', () => {
        expect(matchIngredient(ingredients, 'olive oil')._id).to.equal('ing-oil');
    });

    it('matches a plural name, and ignores case', () => {
        expect(matchIngredient(ingredients, 'EGGS')._id).to.equal('ing-egg');
    });

    it('matches a MongoID', () => {
        const withId = [{ ...ingredients[0], _id: '65f1a2b3c4d5e6f708192a3b' }];
        expect(matchIngredient(withId, '65f1a2b3c4d5e6f708192a3b')._id).to.equal(
            '65f1a2b3c4d5e6f708192a3b'
        );
    });

    it('exits 4 and lists the candidates for an ambiguous name', () => {
        const error = thrown(() => matchIngredient(ingredients, 'stock'));
        expect(error.exitCode).to.equal(ExitCode.NOT_FOUND);
        expect(error.errorCode).to.equal('AMBIGUOUS');
        expect(error.message).to.contain('2 ingredients');
    });

    it('exits 4 for an unknown name, suggesting near matches', () => {
        const error = thrown(() => matchIngredient(ingredients, 'olive oi'));
        expect(error.exitCode).to.equal(ExitCode.NOT_FOUND);
        expect(error.message).to.contain('olive oil');
    });

    it('exits 4 for an unknown MongoID', () => {
        expect(
            thrown(() => matchIngredient(ingredients, '65f1a2b3c4d5e6f708192a3b')).exitCode
        ).to.equal(ExitCode.NOT_FOUND);
    });
});
