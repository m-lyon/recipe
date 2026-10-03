import { expect } from 'chai';

import { ExitCode, fromGraphQLCode } from '../src/lib/errors.js';

describe('GraphQL error mapping', () => {
    const cases: Array<[string | undefined, number, string]> = [
        ['UNAUTHENTICATED', ExitCode.AUTH, 'NOT_AUTHENTICATED'],
        ['FORBIDDEN', ExitCode.AUTH, 'FORBIDDEN'],
        ['NOT_FOUND', ExitCode.NOT_FOUND, 'NOT_FOUND'],
        ['BAD_USER_INPUT', ExitCode.REJECTED, 'BAD_USER_INPUT'],
        ['GRAPHQL_VALIDATION_FAILED', ExitCode.REJECTED, 'BAD_USER_INPUT'],
        [undefined, ExitCode.RUNTIME, 'RUNTIME'],
    ];

    for (const [code, exit, errorCode] of cases) {
        it(`maps ${code ?? 'an uncoded error'} to exit ${exit}`, () => {
            const error = fromGraphQLCode(code, 'boom');
            expect(error.exitCode).to.equal(exit);
            expect(error.errorCode).to.equal(errorCode);
            // The table path reads oclif.exit, the --json path reads exitCode.
            expect(error.oclif.exit).to.equal(exit);
        });
    }
});
