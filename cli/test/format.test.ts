import { expect } from 'chai';

import { pageFooter } from '../src/lib/format.js';

describe('pageFooter', () => {
    it('is null when the page shows every row', () => {
        expect(pageFooter(0, 3, 3)).to.equal(null);
    });

    it('names the rows shown and the total when rows are left out', () => {
        expect(pageFooter(0, 25, 204, '--search')).to.equal(
            'Showing 1–25 of 204. Use --offset and --limit for more, or --search to filter.'
        );
        expect(pageFooter(200, 4, 204)).to.equal(
            'Showing 201–204 of 204. Use --offset and --limit for more.'
        );
    });

    it('says so when the offset is past the last row', () => {
        expect(pageFooter(300, 0, 204)).to.equal('No rows at offset 300. There are 204.');
    });
});
