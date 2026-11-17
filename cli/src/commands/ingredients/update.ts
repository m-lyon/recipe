import { Args, Flags } from '@oclif/core';

import { indent } from '../../lib/format.js';
import { rejected } from '../../lib/errors.js';
import { resolveIngredient } from '../../lib/resolve.js';
import { BaseCommand, writeFlags } from '../../lib/base.js';
import { UPDATE_INGREDIENT } from '../../graphql/operations.js';
import { assertNameFree, normaliseName, sortedTags, tagFlag } from '../../lib/ingredientFields.js';

export default class IngredientsUpdate extends BaseCommand {
    static description =
        'Change an ingredient: its name, plural name, countable state or tags. Only the flags ' +
        'you pass change, and only fields that differ are sent. Recipes keep using it, because ' +
        'they refer to it by id.';

    static examples = [
        '<%= config.bin %> <%= command.id %> "rice wine vinegar" --name "rice vinegar" --dry-run',
        '<%= config.bin %> <%= command.id %> "curry leaf" --countable --plural "curry leaves"',
        '<%= config.bin %> <%= command.id %> honey --tag vegetarian',
    ];

    static args = {
        ingredient: Args.string({ description: 'An exact name or a MongoID', required: true }),
    };

    static flags = {
        name: Flags.string({ description: 'A new singular name' }),
        plural: Flags.string({ description: 'A new plural name' }),
        countable: Flags.boolean({
            description: 'Counted in items; --no-countable for measured',
            allowNo: true,
        }),
        tag: tagFlag('Replaces the tags. Repeat it for both'),
        'clear-tags': Flags.boolean({
            description: 'Remove every tag',
            default: false,
            exclusive: ['tag'],
        }),
        ...writeFlags,
    };

    async run(): Promise<unknown> {
        const { args, flags } = await this.parse(IngredientsUpdate);
        const client = this.api(flags.url);

        const requested =
            flags.name !== undefined ||
            flags.plural !== undefined ||
            flags.countable !== undefined ||
            flags.tag !== undefined ||
            flags['clear-tags'];
        if (!requested) {
            throw rejected(
                'Pass at least one of --name, --plural, --countable, --tag or --clear-tags.'
            );
        }

        const { ingredient, ingredients } = await resolveIngredient(client, args.ingredient);
        const current = {
            name: ingredient.name,
            pluralName: ingredient.pluralName,
            isCountable: ingredient.isCountable,
            tags: sortedTags(ingredient.tags),
        };
        const wanted = {
            name: flags.name !== undefined ? normaliseName(flags.name) : current.name,
            pluralName:
                flags.plural !== undefined ? normaliseName(flags.plural) : current.pluralName,
            isCountable: flags.countable ?? current.isCountable,
            tags: flags['clear-tags'] ? [] : flags.tag ? sortedTags(flags.tag) : current.tags,
        };

        const record: Partial<typeof wanted> = {};
        const lines: string[] = [];
        const show = (value: unknown) =>
            Array.isArray(value)
                ? value.join(', ') || '—'
                : typeof value === 'boolean'
                  ? value
                      ? 'yes'
                      : 'no'
                  : String(value);
        for (const key of ['name', 'pluralName', 'isCountable', 'tags'] as const) {
            if (JSON.stringify(wanted[key]) !== JSON.stringify(current[key])) {
                (record as Record<string, unknown>)[key] = wanted[key];
                lines.push(`${key}: ${show(current[key])} → ${show(wanted[key])}`);
            }
        }
        const summary = { _id: ingredient._id, name: ingredient.name };
        if (lines.length === 0) {
            this.out(
                `No changes: "${ingredient.name}" already has these values. Nothing was sent.`
            );
            return { dryRun: flags['dry-run'], ingredient: summary, record };
        }
        if (record.name !== undefined) {
            assertNameFree(ingredients, record.name, 'The name', ingredient._id);
        }
        if (record.pluralName !== undefined && record.pluralName !== wanted.name) {
            assertNameFree(ingredients, record.pluralName, 'The plural name', ingredient._id);
        }

        if (flags['dry-run']) {
            this.out(
                [
                    'DRY RUN — nothing was sent.',
                    '',
                    `Would update the ingredient "${ingredient.name}":`,
                    indent(lines.join('\n')),
                ].join('\n')
            );
            return { dryRun: true, ingredient: summary, record };
        }

        const updated = (
            await client.request(UPDATE_INGREDIENT, { id: ingredient._id, record: record as never })
        ).ingredientUpdateById?.record;
        this.out(
            [`Updated the ingredient "${ingredient.name}":`, indent(lines.join('\n'))].join('\n')
        );
        return { dryRun: false, ingredient: updated, record };
    }
}
