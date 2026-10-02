import { Args, Flags } from '@oclif/core';

import { BaseCommand } from '../../lib/base.js';
import type { UsdaFoodItem } from '../../lib/types.js';
import { USDA_SEARCH } from '../../graphql/operations.js';
import { num, renderTable, text } from '../../lib/format.js';

/** The resolver caps the page size at this value. */
const MAX_PAGE_SIZE = 200;

export default class UsdaSearch extends BaseCommand {
    static description =
        'Search USDA FoodData Central. Values are per 100 g. Portions are always empty here; ' +
        'fetch a candidate with "usda show" to see them.';

    static examples = [
        '<%= config.bin %> <%= command.id %> "olive oil"',
        '<%= config.bin %> <%= command.id %> "egg" --page-size 5 --json',
    ];

    static args = {
        query: Args.string({ description: 'Search text', required: true }),
    };

    static flags = {
        'page-size': Flags.integer({
            description: `Results to request (the server caps this at ${MAX_PAGE_SIZE})`,
            default: 20,
        }),
    };

    async run(): Promise<unknown> {
        const { args, flags } = await this.parse(UsdaSearch);
        const client = this.api(flags.url);
        const pageSize = Math.min(flags['page-size'], MAX_PAGE_SIZE);
        const results = ((await client.request(USDA_SEARCH, { query: args.query, pageSize }))
            .usdaSearch ?? []) as unknown as UsdaFoodItem[];

        this.out(
            renderTable(
                ['FDCID', 'DESCRIPTION', 'TYPE', 'BRAND', 'KCAL', 'PROT', 'CARB', 'FAT'],
                results.map((item) => [
                    String(item.fdcId),
                    item.description,
                    text(item.dataType),
                    text(item.brandOwner),
                    num(item.caloriesPer100g),
                    num(item.proteinPer100g),
                    num(item.carbsPer100g),
                    num(item.fatPer100g),
                ])
            )
        );
        // Read the full description before accepting a hit: a search for
        // "chicken breast meat only raw" returns Pheasant, breast.
        return { query: args.query, pageSize, results };
    }
}
