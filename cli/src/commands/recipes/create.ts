import { Flags } from '@oclif/core';

import { indent } from '../../lib/format.js';
import { BaseCommand, writeFlags } from '../../lib/base.js';
import { CREATE_RECIPE } from '../../graphql/operations.js';
import { assertIngredientPlural } from '../../lib/recipeFile.js';
import { recipeFileComponents, resolveRecipeFile } from '../../lib/recipeFile.js';
import { describeResolved, parseRecipeFile, readRecipeFileText } from '../../lib/recipeFile.js';

export default class RecipesCreate extends BaseCommand {
    static description =
        'Create a recipe from a recipe file: a JSON object that names its ingredients, units, ' +
        'sizes, prep methods and tags. `recipes export` writes the same shape.';

    static examples = [
        '<%= config.bin %> <%= command.id %> --file soup.json --dry-run',
        'cat soup.json | <%= config.bin %> <%= command.id %> --file -',
    ];

    static flags = {
        file: Flags.string({
            char: 'f',
            description: 'The recipe file, or - to read it from standard input',
            required: true,
            helpValue: 'PATH',
        }),
        ...writeFlags,
    };

    async run(): Promise<unknown> {
        const { flags } = await this.parse(RecipesCreate);
        const client = this.api(flags.url);

        const file = parseRecipeFile(readRecipeFileText(flags.file), 'create');
        assertIngredientPlural(file.isIngredient, file.pluralTitle);
        const resolved = resolveRecipeFile(file, await recipeFileComponents(client));
        const record = { isIngredient: false, ...resolved.record };
        const plan = describeResolved(resolved, record);

        if (flags['dry-run']) {
            this.out(
                [
                    'DRY RUN — nothing was sent.',
                    '',
                    `Would create the recipe "${record.title}":`,
                    indent(plan),
                ].join('\n')
            );
            return { dryRun: true, record };
        }

        const created = (await client.request(CREATE_RECIPE, { record: record as never }))
            .recipeCreateOne?.record;
        this.out(
            [
                `Created the recipe "${created?.title}" (${created?.titleIdentifier}):`,
                indent(plan),
            ].join('\n')
        );
        return { dryRun: false, record, recipe: created };
    }
}
