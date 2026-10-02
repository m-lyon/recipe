import { BaseCommand } from '../../lib/base.js';
import { LOGOUT } from '../../graphql/operations.js';

export default class AuthLogout extends BaseCommand {
    static description =
        'Invalidate the server-side session and delete the cached cookie. The next command ' +
        'authenticates again, so this is not a way to sign out.';

    static examples = ['<%= config.bin %> <%= command.id %>'];

    async run(): Promise<unknown> {
        const { flags } = await this.parse(AuthLogout);
        const client = this.api(flags.url);
        await client.request(LOGOUT);
        client.forgetSession();
        this.out(`Logged out. Removed ${client.session.file}`);
        return { loggedOut: true, sessionFile: client.session.file };
    }
}
