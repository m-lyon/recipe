import { BaseCommand } from '../../lib/base.js';
import { notAuthenticated } from '../../lib/errors.js';
import { CURRENT_USER } from '../../graphql/operations.js';

export default class AuthStatus extends BaseCommand {
    static description =
        'Show the configured endpoint and the authenticated account, including its role.';

    static examples = [
        '<%= config.bin %> <%= command.id %>',
        '<%= config.bin %> <%= command.id %> --json',
    ];

    async run(): Promise<unknown> {
        const { flags } = await this.parse(AuthStatus);
        const client = this.api(flags.url);
        const cached = client.hadCachedSession;
        // A stale cookie makes currentUser null rather than an error, so the
        // transport is told to treat that as an expired session and retry.
        const data = await client.request(CURRENT_USER, undefined, {
            staleWhen: (result) => !result.currentUser,
        });
        const user = data.currentUser;
        if (!user) {
            // The session cookie was accepted but carries no user. Treat it as a
            // rejected credential rather than reporting an empty status.
            throw notAuthenticated(
                'The API returned no current user. Check RECIPE_USERNAME and RECIPE_PASSWORD.'
            );
        }
        // The role line is the point of this command: a non-admin account reads
        // everything and then fails on its first write against an ingredient it
        // does not own.
        if (user.role !== 'admin') {
            this.addWarning(
                `Role is "${user.role}". Writes against ingredients owned by another user will ` +
                    'be refused with exit code 3. Configure an admin account for a bulk run.'
            );
        }
        this.out(
            [
                `URL       ${client.config.url}   (${client.config.nodeEnv})`,
                `User      ${user.username}`,
                `Role      ${user.role}`,
                `Session   ${cached ? 'cached' : 'created'}`,
            ].join('\n')
        );
        return {
            url: client.config.url,
            mode: client.config.nodeEnv,
            sessionCached: cached,
            sessionFile: client.session.file,
            user,
        };
    }
}
