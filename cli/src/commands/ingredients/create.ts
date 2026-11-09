import { Args, Flags } from '@oclif/core';

import { indent } from '../../lib/format.js';
import { allIngredients } from '../../lib/resolve.js';
import { BaseCommand, writeFlags } from '../../lib/base.js';
import { CREATE_INGREDIENT } from '../../graphql/operations.js';
import { assertNameFree, normaliseName, sortedTags, tagFlag } from '../../lib/ingredientFields.js';

export default class IngredientsCreate extends BaseCommand {
    static description =
        'Create an ingredient. Names are stored lower-cased and must not match the name or ' +
        'plural name of another ingredient. Link its nutrition afterwards with `nutrition link`.';

    static examples = [
        '<%= config.bin %> <%= command.id %> "curry leaf" --plural "curry leaves" --countable ' +
            '--tag vegan --tag vegetarian --dry-run',
        '<%= config.bin %> <%= command.id %> "rice vinegar" --tag vegan --tag vegetarian',
    ];

    static args = {
        name: Args.string({ description: 'The singular name', required: true }),
    };

    static flags = {
        plural: Flags.string({
            description: 'The plural name. Defaults to the name, as the web form does',
        }),
        countable: Flags.boolean({
            description: 'Counted in items (2 eggs), not measured (200 g flour)',
            default: false,
        }),
        tag: tagFlag('A dietary tag. Repeat it for both'),
        ...writeFlags,
    };

    async run(): Promise<unknown> {
        const { args, flags } = await this.parse(IngredientsCreate);
        const client = this.api(flags.url);

        const name = normaliseName(args.name);
        const pluralName = normaliseName(flags.plural ?? args.name);
        if (flags.countable && !flags.plural) {
            this.addWarning(
                `A countable ingredient usually has its own plural. The plural is "${pluralName}"; ` +
                    'pass --plural to change it.'
            );
        }
        const ingredients = await allIngredients(client);
        assertNameFree(ingredients, name, 'The name');
        if (pluralName !== name) {
            assertNameFree(ingredients, pluralName, 'The plural name');
        }

        const record = {
            name,
            pluralName,
            isCountable: flags.countable,
            tags: sortedTags(flags.tag),
        };
        const lines = [
            `name: ${record.name}`,
            `plural: ${record.pluralName}`,
            `countable: ${record.isCountable ? 'yes' : 'no'}`,
            `tags: ${record.tags.join(', ') || '—'}`,
        ].join('\n');

        if (flags['dry-run']) {
            this.out(
                [
                    'DRY RUN — nothing was sent.',
                    '',
                    'Would create the ingredient:',
                    indent(lines),
                ].join('\n')
            );
            return { dryRun: true, record };
        }

        const created = (await client.request(CREATE_INGREDIENT, { record: record as never }))
            .ingredientCreateOne?.record;
        this.out([`Created the ingredient ${created?._id}:`, indent(lines)].join('\n'));
        return { dryRun: false, record, ingredient: created };
    }
}
