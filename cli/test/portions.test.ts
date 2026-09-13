import { expect } from 'chai';

import { ExitCode } from '../src/lib/errors.js';
import { selectPortion } from '../src/lib/portions.js';
import { EGG, GARLIC, OLIVE_OIL } from './helpers/fixtures.js';
import { assertItemPortion, itemPortions, renderPortions } from '../src/lib/portions.js';

function thrown(fn: () => unknown): { exitCode: number; errorCode: string; message: string } {
    try {
        fn();
    } catch (error) {
        return error as { exitCode: number; errorCode: string; message: string };
    }
    throw new Error('expected a throw');
}

describe('portions', () => {
    it('counts only item portions', () => {
        expect(itemPortions(EGG.portions!)).to.have.length(5);
        expect(itemPortions(OLIVE_OIL.portions!)).to.have.length(0);
    });

    it('selects by 1-based index, matching the printed table', () => {
        expect(selectPortion(EGG.portions!, '3').description).to.equal('1 jumbo');
    });

    it('selects by description', () => {
        expect(selectPortion(EGG.portions!, '1 large').gramWeight).to.equal(50);
    });

    it('exits 4 for an index or a label that does not exist', () => {
        expect(thrown(() => selectPortion(EGG.portions!, '99')).exitCode).to.equal(
            ExitCode.NOT_FOUND
        );
        expect(thrown(() => selectPortion(EGG.portions!, 'gigantic')).exitCode).to.equal(
            ExitCode.NOT_FOUND
        );
    });

    it('exits 4 when a label matches several portions', () => {
        const error = thrown(() => selectPortion(EGG.portions!, 'large'));
        expect(error.exitCode).to.equal(ExitCode.NOT_FOUND);
        expect(error.errorCode).to.equal('AMBIGUOUS');
    });

    it('refuses a volume portion, which would overstate one egg fivefold', () => {
        const cup = selectPortion(EGG.portions!, '1 cup (4.86 large eggs)');
        const error = thrown(() => assertItemPortion(cup));
        expect(error.exitCode).to.equal(ExitCode.REJECTED);
        expect(error.message).to.contain('volume');
    });

    it("refuses a serving portion, which is garlic's 85 g RACC", () => {
        const error = thrown(() => assertItemPortion(GARLIC.portions![0]));
        expect(error.exitCode).to.equal(ExitCode.REJECTED);
        expect(error.message).to.contain('serving');
    });

    it('prints a KIND column and the item-portion footer', () => {
        const table = renderPortions(EGG.portions!);
        expect(table).to.contain('KIND');
        expect(table).to.contain('item');
        expect(table).to.contain('ambiguous');
        expect(table).to.contain('5 item portions');
    });

    it('says plainly when a record has no item portions', () => {
        expect(renderPortions(OLIVE_OIL.portions!)).to.contain('No item portions');
    });
});
