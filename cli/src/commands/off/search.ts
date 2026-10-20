import { Args, Flags } from '@oclif/core';

import { BaseCommand } from '../../lib/base.js';
import type { OffProduct } from '../../lib/types.js';
import { OFF_SEARCH } from '../../graphql/operations.js';
import { num, renderTable, text } from '../../lib/format.js';

/** The resolver caps the page size at this value. */
const MAX_PAGE_SIZE = 50;

export default class OffSearch extends BaseCommand {
    static description =
        'Search Open Food Facts by name, for UK products unless --all-countries is given. ' +
        'Values are per 100 g. Prefer a barcode: name search is imprecise, and the server ' +
        'allows few searches a minute.';

    static examples = [
        '<%= config.bin %> <%= command.id %> "pearl couscous"',
        '<%= config.bin %> <%= command.id %> "nutritional yeast" --page-size 5 --json',
    ];

    static args = {
        query: Args.string({ description: 'Search text', required: true }),
    };

    static flags = {
        'page-size': Flags.integer({
            description: `Results to request (the server caps this at ${MAX_PAGE_SIZE})`,
            default: 20,
        }),
        'all-countries': Flags.boolean({
            description: 'Include products not recorded as sold in the UK',
            default: false,
        }),
    };

    async run(): Promise<unknown> {
        const { args, flags } = await this.parse(OffSearch);
        const client = this.api(flags.url);
        const pageSize = Math.min(flags['page-size'], MAX_PAGE_SIZE);
        const ukOnly = !flags['all-countries'];
        const results = ((await client.request(OFF_SEARCH, { query: args.query, pageSize, ukOnly }))
            .offSearch ?? []) as unknown as OffProduct[];

        this.out(
            renderTable(
                ['BARCODE', 'NAME', 'BRAND', 'PACK', 'KCAL', 'PROT', 'CARB', 'FAT', 'WARN'],
                results.map((product) => [
                    product.barcode,
                    text(product.name),
                    text(product.brands),
                    text(product.quantity),
                    num(product.caloriesPer100g),
                    num(product.proteinPer100g),
                    num(product.carbsPer100g),
                    num(product.fatPer100g),
                    product.warnings.length > 0 ? 'yes' : '',
                ])
            )
        );
        return { query: args.query, pageSize, ukOnly, results };
    }
}
