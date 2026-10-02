import { expect } from 'chai';

import { ExitCode } from '../src/lib/errors.js';
import { chooseDensity } from '../src/lib/density.js';
import { EGG, FLOUR, GARLIC, OLIVE_OIL } from './helpers/fixtures.js';

function thrown(fn: () => unknown): { exitCode: number; message: string } {
    try {
        fn();
    } catch (error) {
        return error as { exitCode: number; message: string };
    }
    throw new Error('expected a throw');
}

describe('density derivation', () => {
    it('derives 0.913 for olive oil, from the largest volume portion', () => {
        const choice = chooseDensity(OLIVE_OIL.portions!, false);
        expect(choice.density).to.be.closeTo(0.913, 0.001);
        expect(choice.portion.description).to.equal('1 cup');
        expect(choice.spread).to.be.lessThan(0.001);
    });

    it('refuses an ambiguous-only candidate without the override flag', () => {
        const error = thrown(() => chooseDensity(FLOUR.portions!, false));
        expect(error.exitCode).to.equal(ExitCode.REJECTED);
        expect(error.message).to.contain('--allow-ambiguous-density');
    });

    it('uses the ambiguous candidate when the override flag is given', () => {
        expect(chooseDensity(FLOUR.portions!, true).density).to.be.closeTo(0.528, 0.001);
    });

    it('refuses when the record has no volume portion at all', () => {
        expect(thrown(() => chooseDensity(GARLIC.portions!, true)).exitCode).to.equal(
            ExitCode.REJECTED
        );
    });

    it('ignores the ambiguous cup on a record that also has item portions', () => {
        // The egg's only volume portion is the ambiguous "cup (4.86 large eggs)".
        expect(thrown(() => chooseDensity(EGG.portions!, false)).message).to.contain('ambiguous');
    });
});
