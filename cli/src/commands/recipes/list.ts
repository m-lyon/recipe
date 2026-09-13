import { Flags } from '@oclif/core';

import { BaseCommand } from '../../lib/base.js';
import { renderTable } from '../../lib/format.js';
import { GET_RECIPES_BY_IDS } from '../../graphql/operations.js';
import { indexByIngredient, recipeIngredientIds } from '../../lib/nutrition.js';
import { GET_ALL_RECIPES, GET_NUTRITIONAL_INFOS } from '../../graphql/operations.js';
import type { NutritionalInfoSummary, RecipeDetail, RecipeSummary } from '../../lib/types.js';

export default class RecipesList extends BaseCommand {
    static description =
        'List recipes with a count of their ingredients and of the ingredients that have ' +
        'nutritional data. The LINKED column shows where the work is.';

    static examples = [
        '<%= config.bin %> <%= command.id %>',
        '<%= config.bin %> <%= command.id %> --search soup --json',
    ];

    static flags = {
        search: Flags.string({ description: 'Match against the title and the identifier' }),
        limit: Flags.integer({ description: 'Rows to return', default: 25 }),
        offset: Flags.integer({ description: 'Rows to skip', default: 0 }),
    };

    async run(): Promise<unknown> {
        const { flags } = await this.parse(RecipesList);
        const client = this.api(flags.url);

        // The API has no text filter on recipeMany, so the search runs here.
        const all = ((await client.request(GET_ALL_RECIPES)).recipeMany ??
            []) as unknown as RecipeSummary[];
        const needle = flags.search?.trim().toLowerCase();
        const matched = needle
            ? all.filter(
                  (recipe) =>
                      recipe.title.toLowerCase().includes(needle) ||
                      recipe.titleIdentifier.toLowerCase().includes(needle)
              )
            : all;
        const page = matched.slice(flags.offset, flags.offset + flags.limit);

        const rows = await this.countLinked(client, page);
        this.out(
            renderTable(
                ['IDENTIFIER', 'TITLE', 'INGREDIENTS', 'LINKED'],
                rows.map((row) => [
                    row.titleIdentifier,
                    row.title,
                    String(row.ingredients),
                    String(row.linked),
                ])
            )
        );
        return { total: matched.length, offset: flags.offset, limit: flags.limit, recipes: rows };
    }

    private async countLinked(
        client: ReturnType<BaseCommand['api']>,
        page: RecipeSummary[]
    ): Promise<
        Array<{
            _id: string;
            title: string;
            titleIdentifier: string;
            ingredients: number;
            linked: number;
        }>
    > {
        if (page.length === 0) return [];
        const detailed = ((
            await client.request(GET_RECIPES_BY_IDS, {
                ids: page.map((recipe) => recipe._id),
            })
        ).recipeByIds ?? []) as unknown as RecipeDetail[];
        const ingredientIds = [
            ...new Set(detailed.flatMap((recipe) => recipeIngredientIds(recipe))),
        ];
        const infos =
            ingredientIds.length === 0
                ? []
                : ((await client.request(GET_NUTRITIONAL_INFOS, { ingredientIds }))
                      .nutritionalInfosByIngredientIds as unknown as NutritionalInfoSummary[]);
        const byIngredient = indexByIngredient(infos.filter(Boolean));
        const byId = new Map(detailed.map((recipe) => [recipe._id, recipe]));
        return page.map((recipe) => {
            const detail = byId.get(recipe._id);
            const ids = detail ? recipeIngredientIds(detail) : [];
            return {
                _id: recipe._id,
                title: recipe.title,
                titleIdentifier: recipe.titleIdentifier,
                ingredients: ids.length,
                linked: ids.filter((id) => byIngredient.has(id)).length,
            };
        });
    }
}
