import { expect } from 'chai';

import { describeSource, hasValidCheckDigit, offProductName } from '../src/lib/sources.js';

describe('sources', () => {
    it('accepts a barcode whose check digit matches', () => {
        expect(hasValidCheckDigit('5010338301255')).to.equal(true); // EAN-13
        expect(hasValidCheckDigit('0633148100013')).to.equal(true); // EAN-13, leading zero
        expect(hasValidCheckDigit('96385074')).to.equal(true); // EAN-8
        expect(hasValidCheckDigit('036000291452')).to.equal(true); // UPC-A
    });

    it('refuses a misread digit and a value that is not a barcode', () => {
        expect(hasValidCheckDigit('5010338301256')).to.equal(false);
        expect(hasValidCheckDigit('5010338301525')).to.equal(false); // two digits swapped
        expect(hasValidCheckDigit('11213606')).to.equal(false); // a store code
        expect(hasValidCheckDigit('12345')).to.equal(false);
        expect(hasValidCheckDigit('50103383O1255')).to.equal(false);
    });

    it('names a product by brand and name, or by barcode', () => {
        expect(offProductName({ barcode: '1', brands: "Al'fez", name: 'Pearl Couscous' })).to.equal(
            "Al'fez · Pearl Couscous"
        );
        expect(offProductName({ barcode: '0633148100013', brands: null, name: null })).to.equal(
            '0633148100013'
        );
    });

    it('describes each source, and a record from before the source field', () => {
        expect(describeSource({ source: 'usda', usdaFdcId: 171413 })).to.equal('USDA 171413');
        expect(describeSource({ source: 'openFoodFacts', offBarcode: '5010338301255' })).to.equal(
            'Open Food Facts 5010338301255'
        );
        expect(describeSource({ source: 'manual' })).to.equal('manual');
        expect(describeSource({ usdaFdcId: 171287 })).to.equal('USDA 171287');
        expect(describeSource({})).to.equal('manual');
    });
});
