import { Args } from '@oclif/core';

import { BaseCommand } from '../../lib/base.js';
import { exportRecipe, recipeFileComponents } from '../../lib/recipeFile.js';

export default class RecipesExport extends BaseCommand {
    static description =
        'Print a recipe as a recipe file, the JSON that `recipes create` and `recipes update` ' +
        'read. Edit it and pass it to `recipes update` to change the recipe.';

    static examples = [
        '<%= config.bin %> <%= command.id %> tomato-soup-a4f2k > soup.json',
        '<%= config.bin %> <%= command.id %> tomato-soup-a4f2k --json',
    ];

    static args = {
        identifier: Args.string({ description: 'A titleIdentifier or a MongoID', required: true }),
    };

    async run(): Promise<unknown> {
        const { args, flags } = await this.parse(RecipesExport);
        const client = this.api(flags.url);
        const { file } = await exportRecipe(
            client,
            args.identifier,
            await recipeFileComponents(client)
        );
        this.out(JSON.stringify(file, null, 4));
        return file;
    }
}
