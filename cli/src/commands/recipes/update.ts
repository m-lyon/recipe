import { Args, Flags } from '@oclif/core';

import { indent } from '../../lib/format.js';
import { BaseCommand, writeFlags } from '../../lib/base.js';
import { UPDATE_RECIPE } from '../../graphql/operations.js';
import { changedKeys, resolveRecipeFile } from '../../lib/recipeFile.js';
import { exportRecipe, recipeFileComponents } from '../../lib/recipeFile.js';
import { describeResolved, parseRecipeFile, readRecipeFileText } from '../../lib/recipeFile.js';

export default class RecipesUpdate extends BaseCommand {
    static description =
        'Change a recipe from a recipe file. Each key in the file replaces that field, and a ' +
        'key the file leaves out stays as it is. A list, such as ingredientSubsections, is ' +
        'replaced whole. Start from `recipes export` to change one line.';

    static examples = [
        '<%= config.bin %> <%= command.id %> tomato-soup-a4f2k --file soup.json --dry-run',
        '<%= config.bin %> <%= command.id %> tomato-soup-a4f2k --file soup.json',
    ];

    static args = {
        identifier: Args.string({ description: 'A titleIdentifier or a MongoID', required: true }),
    };

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
        const { args, flags } = await this.parse(RecipesUpdate);
        const client = this.api(flags.url);

        const file = parseRecipeFile(readRecipeFileText(flags.file), 'update');
        const components = await recipeFileComponents(client);
        const { recipe, file: current } = await exportRecipe(client, args.identifier, components);

        const changed = changedKeys(file, current);
        const summary = {
            _id: recipe._id,
            title: recipe.title,
            titleIdentifier: recipe.titleIdentifier,
        };
        if (changed.length === 0) {
            this.out(`No changes: the file matches "${recipe.title}". Nothing was sent.`);
            return { dryRun: flags['dry-run'], recipe: summary, changed, record: {} };
        }
        const onlyChanged = Object.fromEntries(changed.map((key) => [key, file[key]]));
        const resolved = resolveRecipeFile(onlyChanged, components);
        const plan = [
            `Fields: ${changed.join(', ')}`,
            describeResolved(resolved, resolved.record),
        ].join('\n');

        if (flags['dry-run']) {
            this.out(
                [
                    'DRY RUN — nothing was sent.',
                    '',
                    `Would update the recipe "${recipe.title}" (${recipe.titleIdentifier}):`,
                    indent(plan),
                ].join('\n')
            );
            return { dryRun: true, recipe: summary, changed, record: resolved.record };
        }

        const updated = (
            await client.request(UPDATE_RECIPE, {
                id: recipe._id,
                record: resolved.record as never,
            })
        ).recipeUpdateById?.record;
        this.out(
            [
                `Updated the recipe "${updated?.title}" (${updated?.titleIdentifier}):`,
                indent(plan),
            ].join('\n')
        );
        return { dryRun: false, recipe: updated, changed, record: resolved.record };
    }
}
